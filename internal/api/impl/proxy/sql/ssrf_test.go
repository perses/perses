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

package sql

import (
	"context"
	"net"
	"testing"

	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api/config"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSQLProxy_postgres_allowedHosts ensures the allowed hosts work with Postgres: pgx resolves the hostname itself and
// dials the resolved IP addresses, so the allowed hosts must be verified on the hostname and not on the IP addresses.
func TestSQLProxy_postgres_allowedHosts(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer func() { _ = listener.Close() }()
	accepted := make(chan struct{}, 10)
	go func() {
		for {
			conn, acceptErr := listener.Accept()
			if acceptErr != nil {
				return
			}
			accepted <- struct{}{}
			_ = conn.Close()
		}
	}()
	_, port, err := net.SplitHostPort(listener.Addr().String())
	require.NoError(t, err)

	newGuard := func(allowedHosts ...string) *netguard.Guard {
		cfg := config.DatasourceProxyConfig{AllowedHosts: allowedHosts, AllowedNetworks: []string{"127.0.0.0/8", "::1/128"}}
		require.NoError(t, cfg.Verify())
		return netguard.New(cfg)
	}
	ping := func(guard *netguard.Guard) error {
		s := &Proxy{
			Config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "localhost:" + port, Database: "perses",
				Postgres: &datasourceSQL.PostgresConfig{SSLMode: datasourceSQL.SSLModeDisable}},
			Guard: guard,
		}
		db, openErr := s.sqlOpen(nil)
		require.NoError(t, openErr)
		defer func() { _ = db.Close() }()
		return db.PingContext(context.Background())
	}

	// The fake server closes the connection: the ping fails, but the connection has been established.
	err = ping(newGuard("localhost"))
	assert.Error(t, err)
	assert.False(t, netguard.IsDenied(err), "expected the connection to be allowed, got %v", err)
	select {
	case <-accepted:
	default:
		t.Fatal("the connection to the database should have been established")
	}

	err = ping(newGuard("db.example.com"))
	assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)
}

func TestSQLProxy_deniedDestination(t *testing.T) {
	for _, test := range []struct {
		title string
		proxy *Proxy
	}{
		{
			title: "postgres",
			proxy: &Proxy{Config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "127.0.0.1:5432", Database: "perses"}, Guard: proxytest.NewDefaultGuard(t)},
		},
		{
			title: "postgres through a hostname",
			proxy: &Proxy{Config: &datasourceSQL.Config{Driver: datasourceSQL.DriverPostgreSQL, Host: "localhost:5432", Database: "perses"}, Guard: proxytest.NewDefaultGuard(t)},
		},
		{
			title: "mysql",
			proxy: &Proxy{Config: &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "127.0.0.1:3306", Database: "perses"}, Guard: proxytest.NewDefaultGuard(t)},
		},
	} {
		t.Run(test.title, func(t *testing.T) {
			db, err := test.proxy.sqlOpen(nil)
			require.NoError(t, err)
			defer func() { _ = db.Close() }()
			err = db.PingContext(context.Background())
			assert.True(t, netguard.IsDenied(err), "expected a denied error, got %v", err)
		})
	}
}

// TestSQLProxy_buildMySQLConfig_dialThroughGuard ensures every connection to the database goes through the guard.
// The Postgres equivalent is covered by TestSQLProxy_deniedDestination.
func TestSQLProxy_buildMySQLConfig_dialThroughGuard(t *testing.T) {
	s := &Proxy{Config: &datasourceSQL.Config{Driver: datasourceSQL.DriverMySQL, Host: "mysql:3306", Database: "perses"}, Guard: proxytest.NewDefaultGuard(t)}
	cfg, err := s.buildMySQLConfig(nil)
	require.NoError(t, err)
	assert.NotNil(t, cfg.DialFunc)
}
