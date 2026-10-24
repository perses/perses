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
	"testing"

	"github.com/go-sql-driver/mysql"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildMySQLConfig(t *testing.T) {
	newSQLConfig := func() *config.SQL {
		return &config.SQL{
			User:     "user",
			Password: "password",
			Net:      "tcp",
			Addr:     "localhost:3306",
			DBName:   "perses",
		}
	}

	t.Run("default config", func(t *testing.T) {
		cfg, err := buildMySQLConfig(newSQLConfig())
		require.NoError(t, err)
		assert.Equal(t, "user", cfg.User)
		assert.Equal(t, "password", cfg.Passwd)
		assert.Equal(t, "tcp", cfg.Net)
		assert.Equal(t, "localhost:3306", cfg.Addr)
		assert.Equal(t, "perses", cfg.DBName)
		// Defaults of the driver
		assert.True(t, cfg.AllowNativePasswords)
		assert.True(t, cfg.CheckConnLiveness)
		assert.Equal(t, mysql.NewConfig().MaxAllowedPacket, cfg.MaxAllowedPacket)
		assert.Nil(t, cfg.TLS)
		assert.Empty(t, cfg.TLSConfig)
	})

	t.Run("defaults of the driver overridden when explicitly set", func(t *testing.T) {
		c := newSQLConfig()
		disabled := false
		c.AllowNativePasswords = &disabled
		c.CheckConnLiveness = &disabled
		cfg, err := buildMySQLConfig(c)
		require.NoError(t, err)
		assert.False(t, cfg.AllowNativePasswords)
		assert.False(t, cfg.CheckConnLiveness)
	})

	t.Run("TLS config set directly, without the global registry of the driver", func(t *testing.T) {
		c := newSQLConfig()
		c.TLSConfig = &secret.PublicTLSConfig{ServerName: "mysql.example.com", MinVersion: "TLS13"}
		cfg, err := buildMySQLConfig(c)
		require.NoError(t, err)
		require.NotNil(t, cfg.TLS)
		assert.Equal(t, "mysql.example.com", cfg.TLS.ServerName)
		assert.Equal(t, uint16(tls.VersionTLS13), cfg.TLS.MinVersion)
		assert.Empty(t, cfg.TLSConfig)
	})

	t.Run("invalid TLS config", func(t *testing.T) {
		c := newSQLConfig()
		c.TLSConfig = &secret.PublicTLSConfig{CAFile: "/does/not/exist.pem"}
		_, err := buildMySQLConfig(c)
		assert.Error(t, err)
	})
}

func TestNewSQL(t *testing.T) {
	t.Run("valid config", func(t *testing.T) {
		// The connection is only established when the database is used.
		d, err := New(config.Database{SQL: &config.SQL{
			User:     "user",
			Password: "password",
			Net:      "tcp",
			Addr:     "localhost:3306",
			DBName:   "perses",
		}})
		require.NoError(t, err)
		require.NoError(t, d.Close())
	})

	t.Run("invalid config rejected by the driver", func(t *testing.T) {
		// The driver doesn't allow interpolating the params with an unsafe collation.
		_, err := New(config.Database{SQL: &config.SQL{
			Net:               "tcp",
			Addr:              "localhost:3306",
			DBName:            "perses",
			Collation:         "gbk_chinese_ci",
			InterpolateParams: true,
		}})
		assert.Error(t, err)
	})
}
