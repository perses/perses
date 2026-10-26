// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-sql-driver/mysql"
	databaseFile "github.com/perses/perses/internal/api/database/file"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	databaseSQL "github.com/perses/perses/internal/api/database/sql"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/tidwall/gjson"
)

type dao struct {
	databaseModel.DAO
	client databaseModel.DAO
}

func (d *dao) Close() error {
	return d.client.Close()
}

func (d *dao) Init() error {
	return d.client.Init()
}
func (d *dao) IsCaseSensitive() bool {
	return d.client.IsCaseSensitive()
}
func (d *dao) Create(entity modelAPI.Entity) error {
	return d.client.Create(entity)
}
func (d *dao) Upsert(entity modelAPI.Entity) error {
	return d.client.Upsert(entity)
}
func (d *dao) Get(kind modelV1.Kind, metadata modelAPI.Metadata, entity modelAPI.Entity) error {
	return d.client.Get(kind, metadata, entity)
}
func (d *dao) Query(query databaseModel.Query, slice any) error {
	return d.client.Query(query, slice)
}
func (d *dao) StreamRaw(query databaseModel.Query, ch chan<- json.RawMessage) error {
	return d.client.StreamRaw(query, ch)
}
func (d *dao) RawQuery(query databaseModel.Query) ([]json.RawMessage, error) {
	ch := make(chan json.RawMessage)
	// StreamRaw closes ch in a defer, before the goroutine stores the returned error.
	errc := make(chan error, 1)
	go func() {
		errc <- d.StreamRaw(query, ch)
	}()
	result := make([]json.RawMessage, 0)
	for data := range ch {
		result = append(result, data)
	}
	if err := <-errc; err != nil {
		return nil, err
	}
	return result, nil
}
func (d *dao) RawMetadataQuery(query databaseModel.Query, kind modelV1.Kind) ([]json.RawMessage, error) {
	ch := make(chan json.RawMessage)
	// StreamRaw closes ch in a defer, before the goroutine stores the returned error.
	errc := make(chan error, 1)
	go func() {
		// Using the StreamRaw method to get the raw data in a stream will reduce the cost of memory allocation
		// and improve performance when the number of resources is large.
		errc <- d.StreamRaw(query, ch)
	}()
	result := make([]json.RawMessage, 0)
	for raw := range ch {
		metadata := gjson.GetBytes(raw, "metadata").String()
		result = append(result, fmt.Appendf(nil, `{"kind":"%s","metadata":%s,"spec":{}}`, kind, metadata))
	}
	if err := <-errc; err != nil {
		return nil, err
	}
	return result, nil
}
func (d *dao) Delete(kind modelV1.Kind, metadata modelAPI.Metadata) error {
	return d.client.Delete(kind, metadata)
}
func (d *dao) DeleteByQuery(query databaseModel.Query) error {
	return d.client.DeleteByQuery(query)
}
func (d *dao) HealthCheck() bool {
	return d.client.HealthCheck()
}
func (d *dao) GetLatestUpdateTime(kind []modelV1.Kind) (*string, error) {
	return d.client.GetLatestUpdateTime(kind)
}

func New(conf config.Database) (databaseModel.DAO, error) {
	var client databaseModel.DAO
	if conf.File != nil {
		client = &databaseFile.DAO{
			Folder:        conf.File.Folder,
			Extension:     conf.File.Extension,
			CaseSensitive: conf.File.CaseSensitive,
		}
	} else if conf.SQL != nil {
		c := conf.SQL
		mysqlConfig, err := buildMySQLConfig(c)
		if err != nil {
			return nil, err
		}
		// Use a connector rather than a DSN: the round trip FormatDSN -> ParseDSN can alter the config
		// (e.g. a username containing a colon is split between the username and the password).
		connector, err := mysql.NewConnector(mysqlConfig)
		if err != nil {
			return nil, fmt.Errorf("invalid MySQL configuration: %w", err)
		}
		db := sql.OpenDB(connector)
		// Configure the connection pool. Retiring connections before the server's
		// wait_timeout prevents stale connections from being reused, which is the
		// main cause of intermittent health check ping failures.
		db.SetConnMaxLifetime(time.Duration(c.ConnMaxLifetime))
		db.SetConnMaxIdleTime(time.Duration(c.ConnMaxIdleTime))
		if c.MaxOpenConns > 0 {
			db.SetMaxOpenConns(c.MaxOpenConns)
		}
		if c.MaxIdleConns > 0 {
			db.SetMaxIdleConns(c.MaxIdleConns)
		}
		client = &databaseSQL.DAO{
			DB:            db,
			SchemaName:    c.DBName,
			CaseSensitive: c.CaseSensitive,
		}
	} else {
		return nil, fmt.Errorf("no dao defined")
	}
	return &dao{client: client}, nil
}

func buildMySQLConfig(c *config.SQL) (*mysql.Config, error) {
	// Start from the driver's default config (via NewConfig) rather than a bare
	// struct literal, so that sane defaults such as CheckConnLiveness=true,
	// AllowNativePasswords=true, Loc=time.UTC and MaxAllowedPacket are preserved
	// unless explicitly overridden.
	mysqlConfig := mysql.NewConfig()
	mysqlConfig.User = string(c.User)
	mysqlConfig.Passwd = string(c.Password)
	mysqlConfig.Net = c.Net
	mysqlConfig.Addr = string(c.Addr)
	mysqlConfig.DBName = c.DBName
	if c.Collation != "" {
		mysqlConfig.Collation = c.Collation
	}
	if c.Loc != nil {
		mysqlConfig.Loc = c.Loc
	}
	if c.MaxAllowedPacket != 0 {
		mysqlConfig.MaxAllowedPacket = c.MaxAllowedPacket
	}
	mysqlConfig.ServerPubKey = c.ServerPubKey
	mysqlConfig.Timeout = time.Duration(c.Timeout)
	mysqlConfig.ReadTimeout = time.Duration(c.ReadTimeout)
	mysqlConfig.WriteTimeout = time.Duration(c.WriteTimeout)
	mysqlConfig.AllowAllFiles = c.AllowAllFiles
	mysqlConfig.AllowCleartextPasswords = c.AllowCleartextPasswords
	mysqlConfig.AllowFallbackToPlaintext = c.AllowFallbackToPlaintext
	mysqlConfig.AllowOldPasswords = c.AllowOldPasswords
	mysqlConfig.ClientFoundRows = c.ClientFoundRows
	mysqlConfig.ColumnsWithAlias = c.ColumnsWithAlias
	mysqlConfig.InterpolateParams = c.InterpolateParams
	mysqlConfig.MultiStatements = c.MultiStatements
	mysqlConfig.ParseTime = c.ParseTime
	mysqlConfig.RejectReadOnly = c.RejectReadOnly
	// AllowNativePasswords and CheckConnLiveness default to true via NewConfig.
	// Only override them when the user explicitly set a value in the config.
	if c.AllowNativePasswords != nil {
		mysqlConfig.AllowNativePasswords = *c.AllowNativePasswords
	}
	if c.CheckConnLiveness != nil {
		mysqlConfig.CheckConnLiveness = *c.CheckConnLiveness
	}

	// (OPTIONAL) Configure TLS
	// The TLS config is set on the connection config directly, so there is no need to register it
	// in the global registry of the driver.
	if c.TLSConfig != nil {
		tlsConfig, err := c.TLSConfig.BuildTLSConfig()
		if err != nil {
			logrus.WithError(err).Error("Failed to parse TLS from configuration")
			return nil, err
		}
		mysqlConfig.TLS = tlsConfig
	}
	return mysqlConfig, nil
}
