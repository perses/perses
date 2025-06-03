// Copyright 2023 The Perses Authors
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

	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/tidwall/gjson"

	"github.com/go-sql-driver/mysql"
	databaseFile "github.com/perses/perses/internal/api/database/file"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	databaseSQL "github.com/perses/perses/internal/api/database/sql"
	"github.com/perses/perses/pkg/model/api/config"
	promConfig "github.com/prometheus/common/config"
	"github.com/sirupsen/logrus"
)

type DAO struct {
	databaseModel.DAO
	Client databaseModel.DAO
}

func (d *DAO) Close() error {
	return d.Client.Close()
}

func (d *DAO) Init() error {
	return d.Client.Init()
}
func (d *DAO) IsCaseSensitive() bool {
	return d.Client.IsCaseSensitive()
}
func (d *DAO) Create(entity modelAPI.Entity) error {
	return d.Client.Create(entity)
}
func (d *DAO) Upsert(entity modelAPI.Entity) error {
	return d.Client.Upsert(entity)
}
func (d *DAO) Get(kind modelV1.Kind, metadata modelAPI.Metadata, entity modelAPI.Entity) error {
	return d.Client.Get(kind, metadata, entity)
}
func (d *DAO) Query(query databaseModel.Query, slice interface{}) error {
	return d.Client.Query(query, slice)
}
func (d *DAO) RawQuery(query databaseModel.Query) ([]json.RawMessage, error) {
	return d.Client.RawQuery(query)
}
func (d *DAO) RawMetadataQuery(query databaseModel.Query, kind modelV1.Kind) ([]json.RawMessage, error) {
	raws, err := d.Client.RawQuery(query)
	if err != nil {
		return nil, err
	}
	// now let's extract the metadata and the kind
	result := make([]json.RawMessage, 0, len(raws))
	for _, raw := range raws {
		metadata := gjson.GetBytes(raw, "metadata").String()
		result = append(result, []byte(fmt.Sprintf(`{"kind":"%s","metadata":%s,"spec":{}}`, kind, metadata)))
	}
	return result, nil
}
func (d *DAO) Delete(kind modelV1.Kind, metadata modelAPI.Metadata) error {
	return d.Client.Delete(kind, metadata)
}
func (d *DAO) DeleteByQuery(query databaseModel.Query) error {
	return d.Client.DeleteByQuery(query)
}
func (d *DAO) HealthCheck() bool {
	return d.Client.HealthCheck()
}
func (d *DAO) GetLatestUpdateTime(kind []modelV1.Kind) (*string, error) {
	return d.Client.GetLatestUpdateTime(kind)
}

func New(conf config.Database) (databaseModel.DAO, error) {
	var client databaseModel.DAO
	if conf.File != nil {
		client = &databaseFile.DAO{
			Folder:        conf.File.Folder,
			Extension:     conf.File.Extension,
			CaseSensitive: conf.File.CaseSensitive,
			HashFileName:  conf.File.HashFileName,
		}
	} else if conf.SQL != nil {
		c := conf.SQL
		mysqlConfig := mysql.Config{
			User:                     string(c.User),
			Passwd:                   string(c.Password),
			Net:                      c.Net,
			Addr:                     string(c.Addr),
			DBName:                   c.DBName,
			Collation:                c.Collation,
			Loc:                      c.Loc,
			MaxAllowedPacket:         c.MaxAllowedPacket,
			ServerPubKey:             c.ServerPubKey,
			Timeout:                  time.Duration(c.Timeout),
			ReadTimeout:              time.Duration(c.ReadTimeout),
			WriteTimeout:             time.Duration(c.WriteTimeout),
			AllowAllFiles:            c.AllowAllFiles,
			AllowCleartextPasswords:  c.AllowCleartextPasswords,
			AllowFallbackToPlaintext: c.AllowFallbackToPlaintext,
			AllowNativePasswords:     c.AllowNativePasswords,
			AllowOldPasswords:        c.AllowOldPasswords,
			CheckConnLiveness:        c.CheckConnLiveness,
			ClientFoundRows:          c.ClientFoundRows,
			ColumnsWithAlias:         c.ColumnsWithAlias,
			InterpolateParams:        c.InterpolateParams,
			MultiStatements:          c.MultiStatements,
			ParseTime:                c.ParseTime,
			RejectReadOnly:           c.RejectReadOnly,
		}

		// (OPTIONAL) Configure TLS
		if c.TLSConfig != nil {
			tlsConfig, parseErr := promConfig.NewTLSConfig(c.TLSConfig)
			if parseErr != nil {
				logrus.WithError(parseErr).Error("Failed to parse TLS from configuration")
				return nil, parseErr
			}
			tlsConfigName := "perses-tls"
			if err := mysql.RegisterTLSConfig(tlsConfigName, tlsConfig); err != nil {
				logrus.WithError(err).Error("Failed to register TLS configuration for mysql connection")
				return nil, err
			}
			mysqlConfig.TLSConfig = tlsConfigName
		}

		db, err := sql.Open("mysql", mysqlConfig.FormatDSN())
		if err != nil {
			return nil, err
		}
		client = &databaseSQL.DAO{
			DB:            db,
			SchemaName:    c.DBName,
			CaseSensitive: c.CaseSensitive,
		}
	} else {
		return nil, fmt.Errorf("no dao defined")
	}
	return &DAO{Client: client}, nil
}
