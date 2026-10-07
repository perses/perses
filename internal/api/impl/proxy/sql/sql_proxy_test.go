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

package sqlproxy

import (
	"context"
	"crypto/tls"
	"database/sql"
	"database/sql/driver"
	"errors"
	"testing"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	mySQLAddress    = "localhost:3306"
	mariaDBAddress  = "localhost:3307"
	postgresAddress = "localhost:5432"
)

func TestNew(t *testing.T) {
	cfg := &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: postgresAddress, Database: "perses"}
	guard := proxytest.NewDefaultGuard(t)
	for _, test := range []struct {
		name          string
		proxy         Proxy
		errorContains string
	}{
		{name: "valid", proxy: Proxy{Config: cfg, Guard: guard, Name: "postgres", Project: "p1", Path: "/"}},
		{name: "missing config", proxy: Proxy{Guard: guard}, errorContains: "the SQL config of the datasource is missing"},
		{name: "missing guard", proxy: Proxy{Config: cfg}, errorContains: "the guard verifying the connections of the proxy is missing"},
	} {
		t.Run(test.name, func(t *testing.T) {
			p, err := New(test.proxy)
			if len(test.errorContains) > 0 {
				assert.ErrorContains(t, err, test.errorContains)
				assert.Nil(t, p)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.proxy, *p)
		})
	}
}

func TestSQLProxy_sqlOpen(t *testing.T) {
	testSuite := []struct {
		name          string
		proxy         *Proxy
		tlsConfig     *tls.Config
		expectError   bool
		errorContains string
	}{
		{
			name: "unsupported driver",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver: "unsupported",
					Host:   mySQLAddress,
				},
			},
			expectError:   true,
			errorContains: "unsupported database driver",
		},
		{
			name: "postgres with tls and sslmode disable",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "perses",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: "disable",
					},
				},
			},
			tlsConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
			expectError:   true,
			errorContains: "the sslMode is not set or set to disable",
		},
		{
			name: "mysql success",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMySQL,
					Host:     mySQLAddress,
					Database: "testdb",
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mysql with username",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMySQL,
					Host:     mySQLAddress,
					Database: "testdb",
				},
				username: "testuser",
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mysql with custom config",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMySQL,
					Host:     mySQLAddress,
					Database: "testdb",
					MySQL: &datasourceSQL.MySQLConfig{
						Params: map[string]string{
							"charset":   "utf8mb4",
							"parseTime": "true",
						},
						MaxAllowedPacket: 67108864,
					},
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mariadb success",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "mariadb with username and password",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
				},
				username: "mariauser",
				password: "mariapass",
			},
			expectError: false,
		},
		{
			name: "mariadb with custom config",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
					MariaDB: &datasourceSQL.MySQLConfig{
						Params: map[string]string{
							"charset":   "utf8mb4",
							"collation": "utf8mb4_unicode_ci",
						},
						MaxAllowedPacket: 33554432,
					},
				},
				username: "mariauser",
				password: "mariapass",
			},
			expectError: false,
		},
		{
			name: "mariadb with tls",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverMariaDB,
					Host:     mariaDBAddress,
					Database: "testdb",
					MariaDB: &datasourceSQL.MySQLConfig{
						Params: map[string]string{
							"charset": "utf8mb4",
						},
					},
				},
				Name:     "mariadb-ds",
				Project:  "testproject",
				username: "mariauser",
				password: "mariapass",
			},
			tlsConfig:   &tls.Config{MinVersion: tls.VersionTLS12},
			expectError: false,
		},
		{
			name: "postgres success",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
				},
				password: "password",
			},
			expectError: false,
		},
		{
			name: "postgres with username",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: datasourceSQL.SSLModeDisable,
					},
				},
				username: "pguser",
				password: "pgpass",
			},
			expectError: false,
		},
		{
			name: "postgres no password",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver: datasourceSQL.DriverPostgreSQL,
					Host:   postgresAddress,
				},
			},
			expectError: false,
		},
		{
			name: "postgres with all ssl modes - prefer",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: datasourceSQL.SSLModePreferable,
					},
				},
			},
			expectError: false,
		},
		{
			name: "postgres with ssl mode require and tls",
			proxy: &Proxy{
				Config: &datasourceSQL.Config{
					Driver:   datasourceSQL.DriverPostgreSQL,
					Host:     postgresAddress,
					Database: "testdb",
					Postgres: &datasourceSQL.PostgresConfig{
						SSLMode: datasourceSQL.SSLModeRequire,
					},
				},
			},
			tlsConfig:   &tls.Config{MinVersion: tls.VersionTLS12},
			expectError: false,
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			db, err := test.proxy.sqlOpen(test.tlsConfig)
			if test.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), test.errorContains)
			} else {
				assert.NoError(t, err)
				require.NotNil(t, db)
				_ = db.Close()
			}
		})
	}
}

func TestSQLProxy_prepareTLSConfig(t *testing.T) {
	t.Run("no secret", func(t *testing.T) {
		tlsConfig, err := (&Proxy{}).prepareTLSConfig()
		require.NoError(t, err)
		assert.Nil(t, tlsConfig)
	})
	t.Run("secret without TLS config", func(t *testing.T) {
		s := &Proxy{Secret: &v1.SecretSpec{BasicAuth: &secretModel.BasicAuth{Username: "user", Password: "password"}}}
		tlsConfig, err := s.prepareTLSConfig()
		require.NoError(t, err)
		assert.Nil(t, tlsConfig)
	})
	t.Run("secret with TLS config", func(t *testing.T) {
		s := &Proxy{Secret: &v1.SecretSpec{TLSConfig: &secretModel.TLSConfig{InsecureSkipVerify: true}}}
		tlsConfig, err := s.prepareTLSConfig()
		require.NoError(t, err)
		require.NotNil(t, tlsConfig)
		assert.True(t, tlsConfig.InsecureSkipVerify)
	})
}

func TestSQLProxy_buildMySQLConfig(t *testing.T) {
	newProxy := func(driverConfig *datasourceSQL.MySQLConfig) *Proxy {
		return &Proxy{
			Config:   &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "localhost:3306", Database: "perses", MySQL: driverConfig},
			username: "user",
			password: "password",
		}
	}

	t.Run("default config", func(t *testing.T) {
		cfg, err := newProxy(nil).buildMySQLConfig(nil)
		require.NoError(t, err)
		assert.Equal(t, "localhost:3306", cfg.Addr)
		assert.Equal(t, "perses", cfg.DBName)
		assert.Equal(t, "user", cfg.User)
		assert.Equal(t, "password", cfg.Passwd)
		// Default of the driver, required by the default authentication method of MariaDB.
		assert.True(t, cfg.AllowNativePasswords)
		assert.Equal(t, mysql.NewConfig().MaxAllowedPacket, cfg.MaxAllowedPacket)
		// TLS is required by default, the certificate being verified with the system CAs.
		require.NotNil(t, cfg.TLS)
		assert.False(t, cfg.TLS.InsecureSkipVerify)
		assert.Nil(t, cfg.TLS.RootCAs)
	})

	t.Run("TLS config of the secret set directly, without the global registry of the driver", func(t *testing.T) {
		tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12, InsecureSkipVerify: true} //nolint:gosec
		cfg, err := newProxy(nil).buildMySQLConfig(tlsConfig)
		require.NoError(t, err)
		assert.Same(t, tlsConfig, cfg.TLS)
		assert.Empty(t, cfg.TLSConfig)
	})

	t.Run("TLS disabled with the tls param", func(t *testing.T) {
		cfg, err := newProxy(&datasourceSQL.MySQLConfig{Params: map[string]string{"tls": "false"}}).buildMySQLConfig(nil)
		require.NoError(t, err)
		assert.Nil(t, cfg.TLS)
	})

	t.Run("params interpreted like in a DSN", func(t *testing.T) {
		cfg, err := newProxy(&datasourceSQL.MySQLConfig{
			Params:           map[string]string{"parseTime": "true", "sql_mode": "'ANSI'"},
			MaxAllowedPacket: 1024,
			Timeout:          "5s",
			ReadTimeout:      "10s",
		}).buildMySQLConfig(nil)
		require.NoError(t, err)
		assert.True(t, cfg.ParseTime)
		assert.Equal(t, map[string]string{"sql_mode": "'ANSI'"}, cfg.Params)
		assert.Equal(t, 1024, cfg.MaxAllowedPacket)
		assert.Equal(t, 5*time.Second, cfg.Timeout)
		assert.Equal(t, 10*time.Second, cfg.ReadTimeout)
	})

	t.Run("multiple statements always disabled", func(t *testing.T) {
		cfg, err := newProxy(&datasourceSQL.MySQLConfig{Params: map[string]string{"multiStatements": "true"}}).buildMySQLConfig(nil)
		require.NoError(t, err)
		assert.False(t, cfg.MultiStatements)
	})

	t.Run("options letting the server read local files or get the password in clear text always disabled", func(t *testing.T) {
		params := map[string]string{"allowAllFiles": "true", "allowCleartextPasswords": "true", "allowOldPasswords": "true"}
		// Make sure the params are actually honored by the driver, otherwise this test would pass for the wrong reason.
		dsnConfig, err := mysql.ParseDSN("user:password@tcp(localhost:3306)/perses?allowAllFiles=true&allowCleartextPasswords=true&allowOldPasswords=true")
		require.NoError(t, err)
		require.True(t, dsnConfig.AllowAllFiles)
		require.True(t, dsnConfig.AllowCleartextPasswords)
		require.True(t, dsnConfig.AllowOldPasswords)

		for _, driver := range []datasourceSQL.Driver{datasourceSQL.DriverMySQL, datasourceSQL.DriverMariaDB} {
			p := newProxy(&datasourceSQL.MySQLConfig{Params: params})
			p.Config.Driver = driver
			if driver == datasourceSQL.DriverMariaDB {
				p.Config.MySQL = nil
				p.Config.MariaDB = &datasourceSQL.MySQLConfig{Params: params}
			}
			cfg, err := p.buildMySQLConfig(nil)
			require.NoError(t, err, driver)
			assert.False(t, cfg.AllowAllFiles, driver)
			assert.False(t, cfg.AllowCleartextPasswords, driver)
			assert.False(t, cfg.AllowOldPasswords, driver)
		}
	})

	t.Run("MariaDB config used for MariaDB", func(t *testing.T) {
		p := newProxy(nil)
		p.Config.Driver = datasourceSQL.DriverMariaDB
		p.Config.MariaDB = &datasourceSQL.MySQLConfig{Params: map[string]string{"tls": "false"}}
		cfg, err := p.buildMySQLConfig(nil)
		require.NoError(t, err)
		assert.Nil(t, cfg.TLS)
	})
}

func TestSQLProxy_buildPostgresConfig(t *testing.T) {
	newProxy := func(postgresConfig *datasourceSQL.PostgresConfig) *Proxy {
		return &Proxy{
			Config:   &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "localhost:5432", Database: "perses", Postgres: postgresConfig},
			username: "user",
			password: "password",
		}
	}
	customTLSConfig := &tls.Config{MinVersion: tls.VersionTLS12}

	t.Run("no sslMode and no TLS config: pgx default", func(t *testing.T) {
		cfg, err := newProxy(nil).buildPostgresConfig(nil)
		require.NoError(t, err)
		assert.Equal(t, "localhost", cfg.Host)
		assert.Equal(t, uint16(5432), cfg.Port)
		assert.Equal(t, "perses", cfg.Database)
		assert.Equal(t, "user", cfg.User)
		assert.Equal(t, "password", cfg.Password)
	})

	t.Run("sslMode disable and no TLS config", func(t *testing.T) {
		cfg, err := newProxy(&datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeDisable}).buildPostgresConfig(nil)
		require.NoError(t, err)
		assert.Nil(t, cfg.TLSConfig)
		assert.Empty(t, cfg.Fallbacks)
	})

	t.Run("TLS config with sslMode not set", func(t *testing.T) {
		_, err := newProxy(nil).buildPostgresConfig(customTLSConfig)
		assert.ErrorContains(t, err, "the sslMode is not set or set to disable")
	})

	t.Run("TLS config with sslMode disable", func(t *testing.T) {
		_, err := newProxy(&datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeDisable}).buildPostgresConfig(customTLSConfig)
		assert.ErrorContains(t, err, "the sslMode is not set or set to disable")
	})

	t.Run("TLS config used with the server name set from the host", func(t *testing.T) {
		cfg, err := newProxy(&datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeVerifyFull}).buildPostgresConfig(customTLSConfig)
		require.NoError(t, err)
		require.NotNil(t, cfg.TLSConfig)
		assert.Equal(t, "localhost", cfg.TLSConfig.ServerName)
		assert.Equal(t, uint16(tls.VersionTLS12), cfg.TLSConfig.MinVersion)
		// The TLS config of the secret is not modified.
		assert.Empty(t, customTLSConfig.ServerName)
	})

	t.Run("server name of the TLS config kept", func(t *testing.T) {
		tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12, ServerName: "db.example.com"}
		cfg, err := newProxy(&datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeVerifyFull}).buildPostgresConfig(tlsConfig)
		require.NoError(t, err)
		assert.Equal(t, "db.example.com", cfg.TLSConfig.ServerName)
	})

	t.Run("no server name set when the verification is disabled", func(t *testing.T) {
		tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12, InsecureSkipVerify: true} //nolint:gosec
		cfg, err := newProxy(&datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeRequire}).buildPostgresConfig(tlsConfig)
		require.NoError(t, err)
		assert.Empty(t, cfg.TLSConfig.ServerName)
		assert.True(t, cfg.TLSConfig.InsecureSkipVerify)
	})

	t.Run("TLS config used for the TLS attempts only", func(t *testing.T) {
		// With "prefer", pgx tries with TLS, then without.
		cfg, err := newProxy(&datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModePreferable}).buildPostgresConfig(customTLSConfig)
		require.NoError(t, err)
		require.NotNil(t, cfg.TLSConfig)
		assert.Equal(t, "localhost", cfg.TLSConfig.ServerName)
		require.Len(t, cfg.Fallbacks, 1)
		assert.Nil(t, cfg.Fallbacks[0].TLSConfig)
	})

	t.Run("connect timeout converted to seconds", func(t *testing.T) {
		for _, test := range []struct {
			connectTimeout string
			expected       time.Duration
		}{
			{connectTimeout: "10s", expected: 10 * time.Second},
			{connectTimeout: "1m", expected: time.Minute},
			{connectTimeout: "1500ms", expected: 2 * time.Second},
			{connectTimeout: "0", expected: 0},
		} {
			cfg, err := newProxy(&datasourceSQL.PostgresConfig{ConnectTimeout: common.DurationString(test.connectTimeout)}).buildPostgresConfig(nil)
			require.NoError(t, err, test.connectTimeout)
			assert.Equal(t, test.expected, cfg.ConnectTimeout, test.connectTimeout)
		}
	})

	t.Run("options not sent as runtime params when unknown to PostgreSQL", func(t *testing.T) {
		threshold := 5
		cfg, err := newProxy(&datasourceSQL.PostgresConfig{PrepareThreshold: &threshold, MaxConns: 10}).buildPostgresConfig(nil)
		require.NoError(t, err)
		assert.NotContains(t, cfg.RuntimeParams, "prepareThreshold")
		assert.NotContains(t, cfg.RuntimeParams, "pool_max_conns")
	})
}

func TestSQLProxy_openPostgres_maxConns(t *testing.T) {
	s := &Proxy{Config: &datasourceSQL.Config{
		Driver:   datasourceSQL.DriverPostgreSQL,
		Host:     "localhost:5432",
		Database: "perses",
		Postgres: &datasourceSQL.PostgresConfig{MaxConns: 7},
	}}
	db, err := s.openPostgres(nil)
	require.NoError(t, err)
	defer func() { _ = db.Close() }()
	assert.Equal(t, 7, db.Stats().MaxOpenConnections)
}

// fakeConnector is a database/sql connector whose connections can fail to be established, or to start a transaction.
type fakeConnector struct {
	connectErr error
	beginErr   error
	// readOnly records whether the last transaction has been started as read-only.
	readOnly *bool
}

func (c fakeConnector) Connect(context.Context) (driver.Conn, error) {
	if c.connectErr != nil {
		return nil, c.connectErr
	}
	return fakeConn(c), nil
}

func (c fakeConnector) Driver() driver.Driver { return nil }

type fakeConn fakeConnector

func (c fakeConn) Prepare(string) (driver.Stmt, error) { return nil, errors.New("not implemented") }
func (c fakeConn) Close() error                        { return nil }
func (c fakeConn) Begin() (driver.Tx, error)           { return nil, errors.New("not implemented") }

func (c fakeConn) BeginTx(_ context.Context, opts driver.TxOptions) (driver.Tx, error) {
	if c.beginErr != nil {
		return nil, c.beginErr
	}
	*c.readOnly = opts.ReadOnly
	return fakeTx{}, nil
}

type fakeTx struct{}

func (fakeTx) Commit() error   { return nil }
func (fakeTx) Rollback() error { return nil }

func TestBeginReadOnlyTx(t *testing.T) {
	errConnect := errors.New("connection refused")
	errBegin := errors.New("syntax error near READ ONLY")

	t.Run("read-only transaction started", func(t *testing.T) {
		readOnly := false
		db := sql.OpenDB(fakeConnector{readOnly: &readOnly})
		defer func() { _ = db.Close() }()
		conn, tx, err := beginReadOnlyTx(context.Background(), db)
		require.NoError(t, err)
		assert.True(t, readOnly)
		require.NoError(t, tx.Rollback())
		require.NoError(t, conn.Close())
	})

	t.Run("connection error told apart from the transaction error", func(t *testing.T) {
		db := sql.OpenDB(fakeConnector{connectErr: errConnect})
		defer func() { _ = db.Close() }()
		_, _, err := beginReadOnlyTx(context.Background(), db)
		require.ErrorIs(t, err, errConnect)
		assert.NotErrorIs(t, err, errReadOnlyTx)
	})

	t.Run("read-only transaction not supported by the database", func(t *testing.T) {
		readOnly := false
		db := sql.OpenDB(fakeConnector{beginErr: errBegin, readOnly: &readOnly})
		defer func() { _ = db.Close() }()
		_, _, err := beginReadOnlyTx(context.Background(), db)
		require.ErrorIs(t, err, errReadOnlyTx)
		assert.ErrorIs(t, err, errBegin)
		// The connection has been released: the database can be closed without waiting for it.
		assert.Equal(t, 0, db.Stats().InUse)
	})
}
