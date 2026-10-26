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
	"crypto/tls"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/go-sql-driver/mysql"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newSQLConfig() *config.SQL {
	return &config.SQL{
		User:     "user",
		Password: "password",
		Net:      "tcp",
		Addr:     "localhost:3306",
		DBName:   "perses",
	}
}

// newMySQLConfig returns the config expected for newSQLConfig: the defaults of the driver
// (AllowNativePasswords, CheckConnLiveness, MaxAllowedPacket, ...) are kept.
func newMySQLConfig() *mysql.Config {
	cfg := mysql.NewConfig()
	cfg.User = "user"
	cfg.Passwd = "password"
	cfg.Net = "tcp"
	cfg.Addr = "localhost:3306"
	cfg.DBName = "perses"
	return cfg
}

func TestBuildMySQLConfig(t *testing.T) {
	disabled := false
	testSuite := []struct {
		name        string
		config      func() *config.SQL
		expected    func() *mysql.Config
		expectError bool
	}{
		{
			name:     "default config",
			config:   newSQLConfig,
			expected: newMySQLConfig,
		},
		{
			name: "optional fields set",
			config: func() *config.SQL {
				c := newSQLConfig()
				c.Collation = "utf8mb4_unicode_ci"
				c.Loc = time.Local
				c.MaxAllowedPacket = 1024
				c.Timeout = common.Duration(5 * time.Second)
				c.ReadTimeout = common.Duration(10 * time.Second)
				c.ParseTime = true
				return c
			},
			expected: func() *mysql.Config {
				cfg := newMySQLConfig()
				cfg.Collation = "utf8mb4_unicode_ci"
				cfg.Loc = time.Local
				cfg.MaxAllowedPacket = 1024
				cfg.Timeout = 5 * time.Second
				cfg.ReadTimeout = 10 * time.Second
				cfg.ParseTime = true
				return cfg
			},
		},
		{
			name: "defaults of the driver overridden when explicitly set",
			config: func() *config.SQL {
				c := newSQLConfig()
				c.AllowNativePasswords = &disabled
				c.CheckConnLiveness = &disabled
				return c
			},
			expected: func() *mysql.Config {
				cfg := newMySQLConfig()
				cfg.AllowNativePasswords = false
				cfg.CheckConnLiveness = false
				return cfg
			},
		},
		{
			name: "TLS config set directly, without the global registry of the driver",
			config: func() *config.SQL {
				c := newSQLConfig()
				c.TLSConfig = &secret.PublicTLSConfig{ServerName: "mysql.example.com", MinVersion: "TLS13"}
				return c
			},
			expected: func() *mysql.Config {
				cfg := newMySQLConfig()
				cfg.TLS = &tls.Config{ServerName: "mysql.example.com", MinVersion: tls.VersionTLS13, MaxVersion: tls.VersionTLS13}
				return cfg
			},
		},
		{
			name: "invalid TLS config",
			config: func() *config.SQL {
				c := newSQLConfig()
				c.TLSConfig = &secret.PublicTLSConfig{CAFile: "/does/not/exist.pem"}
				return c
			},
			expectError: true,
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			cfg, err := buildMySQLConfig(test.config())
			if test.expectError {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expected(), cfg)
		})
	}
}

func TestNewSQL(t *testing.T) {
	testSuite := []struct {
		name        string
		config      *config.SQL
		expectError bool
	}{
		{
			// The connection is only established when the database is used.
			name:   "valid config",
			config: newSQLConfig(),
		},
		{
			// The driver doesn't allow interpolating the params with an unsafe collation.
			name: "invalid config rejected by the driver",
			config: &config.SQL{
				Net:               "tcp",
				Addr:              "localhost:3306",
				DBName:            "perses",
				Collation:         "gbk_chinese_ci",
				InterpolateParams: true,
			},
			expectError: true,
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			d, err := New(config.Database{SQL: test.config})
			if test.expectError {
				assert.ErrorContains(t, err, "invalid MySQL configuration")
				return
			}
			require.NoError(t, err)
			require.NoError(t, d.Close())
		})
	}
}

// failingStreamDAO streams one dashboard and then fails.
// Like the real implementations, it closes the channel before StreamRaw returns the error.
type failingStreamDAO struct {
	databaseModel.DAO
	err error
}

func (f *failingStreamDAO) StreamRaw(_ databaseModel.Query, ch chan<- json.RawMessage) error {
	// The deferred calls run in reverse order: the channel is closed, then the reader is given time
	// to notice it before the error is returned.
	defer time.Sleep(50 * time.Millisecond)
	defer close(ch)
	ch <- json.RawMessage(`{"kind":"Dashboard","metadata":{"name":"foo","project":"perses"},"spec":{}}`)
	return f.err
}

func TestRawQueriesReturnStreamError(t *testing.T) {
	streamErr := errors.New("unable to read the dashboards")
	d := &dao{client: &failingStreamDAO{err: streamErr}}

	t.Run("RawQuery", func(t *testing.T) {
		result, err := d.RawQuery(&dashboard.Query{})
		assert.ErrorIs(t, err, streamErr)
		assert.Nil(t, result)
	})

	t.Run("RawMetadataQuery", func(t *testing.T) {
		result, err := d.RawMetadataQuery(&dashboard.Query{}, modelV1.KindDashboard)
		assert.ErrorIs(t, err, streamErr)
		assert.Nil(t, result)
	})
}
