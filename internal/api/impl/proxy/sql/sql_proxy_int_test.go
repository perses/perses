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

//go:build integration

package sql

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// The databases are the ones started by the CI (see .github/workflows/go.yml).
// The address and the credentials can be overridden with environment variables, to run the tests against other databases.
func envOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); len(value) > 0 {
		return value
	}
	return defaultValue
}

// serveSQLQuery sends the query to the SQL proxy, like the frontend does.
func serveSQLQuery(t *testing.T, s *Proxy, query string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	body := fmt.Sprintf(`{"query": %q}`, query)
	req := httptest.NewRequest(http.MethodPost, "http://perses.example.com/proxy", strings.NewReader(body))
	rec := httptest.NewRecorder()
	return rec, s.Serve(echo.New().NewContext(req, rec))
}

// countRows counts the rows of the table, without going through the SQL proxy.
func countRows(t *testing.T, s *Proxy, table string) int {
	t.Helper()
	require.NoError(t, s.setupAuthentication())
	db, err := s.sqlOpen(nil)
	require.NoError(t, err)
	defer func() { _ = db.Close() }()
	var count int
	require.NoError(t, db.QueryRow(fmt.Sprintf("SELECT count(*) FROM %s", table)).Scan(&count))
	return count
}

func newTestTableName() string {
	return fmt.Sprintf("perses_sql_proxy_test_%d", time.Now().UnixNano())
}

func TestSQLProxy_Postgres(t *testing.T) {
	newPostgresProxy := func(postgresConfig *datasourceSQL.PostgresConfig) *Proxy {
		return &Proxy{
			// The test database is running on the loopback interface, denied by default.
			Guard: proxytest.NewLoopbackGuard(t),
			Config: &datasourceSQL.Config{
				Driver:   datasourceSQL.DriverPostgreSQL,
				Host:     envOrDefault("PERSES_TEST_POSTGRES_ADDR", "localhost:5432"),
				Database: envOrDefault("PERSES_TEST_POSTGRES_DATABASE", "perses"),
				Postgres: postgresConfig,
			},
			Secret: &v1.SecretSpec{BasicAuth: &secretModel.BasicAuth{
				Username: envOrDefault("PERSES_TEST_POSTGRES_USER", "user"),
				Password: envOrDefault("PERSES_TEST_POSTGRES_PASSWORD", "password"),
			}},
			Name: "postgres",
		}
	}

	// Create a table directly, without going through the (read-only) SQL proxy.
	table := newTestTableName()
	admin := newPostgresProxy(nil)
	require.NoError(t, admin.setupAuthentication())
	adminDB, err := admin.sqlOpen(nil)
	require.NoError(t, err)
	for _, statement := range []string{
		fmt.Sprintf("CREATE TABLE %s (id int)", table),
		fmt.Sprintf("INSERT INTO %s SELECT generate_series(1, 10)", table),
	} {
		_, err = adminDB.Exec(statement)
		require.NoError(t, err, statement)
	}
	t.Cleanup(func() {
		_, _ = adminDB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s", table))
		_ = adminDB.Close()
	})

	t.Run("without TLS config, whatever the sslMode", func(t *testing.T) {
		for _, sslMode := range []datasourceSQL.SSLMode{"", datasourceSQL.SSLModeDisable, datasourceSQL.SSLModePreferable} {
			rec, err := serveSQLQuery(t, newPostgresProxy(&datasourceSQL.PostgresConfig{SSLMode: sslMode}), fmt.Sprintf("SELECT count(*) AS count FROM %s", table))
			require.NoError(t, err, "sslMode %q", sslMode)
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.Contains(t, rec.Body.String(), `"rows":[{"count":10}]`)
		}
	})

	t.Run("with connect timeout and prepare threshold", func(t *testing.T) {
		threshold := 0
		rec, err := serveSQLQuery(t, newPostgresProxy(&datasourceSQL.PostgresConfig{ConnectTimeout: "10s", PrepareThreshold: &threshold}), "SELECT 1 AS one")
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("data-modifying CTE rejected by the read-only transaction", func(t *testing.T) {
		// The query passes the keyword check, and the connection works: only the read-only transaction can reject it.
		rec, err := serveSQLQuery(t, newPostgresProxy(nil), fmt.Sprintf("WITH d AS (SELECT * FROM %s) SELECT count(*) AS count FROM d", table))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		_, err = serveSQLQuery(t, newPostgresProxy(nil), fmt.Sprintf("WITH d AS (DELETE FROM %s RETURNING *) SELECT count(*) FROM d", table))
		require.Error(t, err)
		assert.Equal(t, 10, countRows(t, newPostgresProxy(nil), table))
	})

	t.Run("anonymous code block rejected", func(t *testing.T) {
		_, err := serveSQLQuery(t, newPostgresProxy(nil), fmt.Sprintf("DO $$BEGIN DELETE FROM %s; END$$", table))
		require.Error(t, err)
		assert.Contains(t, err.Error(), "only read-only queries are allowed")
		assert.Equal(t, 10, countRows(t, newPostgresProxy(nil), table))
	})

	t.Run("connection error not reported as a read-only transaction error", func(t *testing.T) {
		// The connection is established when the query is executed: the error happens before starting the transaction.
		s := newPostgresProxy(nil)
		s.Config.Database = "perses_database_not_existing"
		_, err := serveSQLQuery(t, s, "SELECT 1 AS one")
		require.Error(t, err)
		assert.NotContains(t, err.Error(), "read-only transaction")
	})
}

func TestSQLProxy_MariaDB(t *testing.T) {
	if os.Getenv("PERSES_TEST_USE_SQL") != "true" {
		t.Skip("MariaDB is only available when PERSES_TEST_USE_SQL is true")
	}
	newMariaDBProxy := func(params map[string]string) *Proxy {
		// The params always disable TLS, as the certificate of the test server is not trusted.
		allParams := map[string]string{"tls": "false"}
		for k, v := range params {
			allParams[k] = v
		}
		return &Proxy{
			// The test database is running on the loopback interface, denied by default.
			Guard: proxytest.NewLoopbackGuard(t),
			Config: &datasourceSQL.Config{
				Driver:   datasourceSQL.DriverMariaDB,
				Host:     envOrDefault("PERSES_TEST_MARIADB_ADDR", "localhost:3306"),
				Database: envOrDefault("PERSES_TEST_MARIADB_DATABASE", "perses"),
				MariaDB:  &datasourceSQL.MySQLConfig{Params: allParams},
			},
			Secret: &v1.SecretSpec{BasicAuth: &secretModel.BasicAuth{
				Username: envOrDefault("PERSES_TEST_MARIADB_USER", "root"),
				Password: envOrDefault("PERSES_TEST_MARIADB_PASSWORD", "root"),
			}},
			Name: "mariadb",
		}
	}

	// Create a table and a stored procedure deleting its rows directly, without going through the (read-only) SQL proxy.
	table := newTestTableName()
	admin := newMariaDBProxy(nil)
	require.NoError(t, admin.setupAuthentication())
	adminDB, err := admin.sqlOpen(nil)
	require.NoError(t, err)
	for _, statement := range []string{
		fmt.Sprintf("CREATE TABLE %s (id int)", table),
		fmt.Sprintf("INSERT INTO %s VALUES (1), (2), (3)", table),
		fmt.Sprintf("CREATE PROCEDURE %s_wipe() DELETE FROM %s", table, table),
	} {
		_, err = adminDB.Exec(statement)
		require.NoError(t, err, statement)
	}
	t.Cleanup(func() {
		_, _ = adminDB.Exec(fmt.Sprintf("DROP PROCEDURE IF EXISTS %s_wipe", table))
		_, _ = adminDB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s", table))
		_ = adminDB.Close()
	})

	t.Run("read query", func(t *testing.T) {
		rec, err := serveSQLQuery(t, newMariaDBProxy(nil), fmt.Sprintf("SELECT count(*) AS count FROM %s", table))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), `"rows":[{"count":3}]`)
	})

	t.Run("stored procedure rejected", func(t *testing.T) {
		_, err := serveSQLQuery(t, newMariaDBProxy(nil), fmt.Sprintf("CALL %s_wipe()", table))
		require.Error(t, err)
		assert.Equal(t, 3, countRows(t, newMariaDBProxy(nil), table))
	})

	t.Run("statement modifying the schema rejected", func(t *testing.T) {
		_, err := serveSQLQuery(t, newMariaDBProxy(nil), fmt.Sprintf("RENAME TABLE %s TO %s_renamed", table, table))
		require.Error(t, err)
		assert.Equal(t, 3, countRows(t, newMariaDBProxy(nil), table))
	})

	t.Run("multiple statements rejected, even when enabled in the params", func(t *testing.T) {
		_, err := serveSQLQuery(t, newMariaDBProxy(map[string]string{"multiStatements": "true"}), fmt.Sprintf("SELECT 1; COMMIT; DELETE FROM %s", table))
		require.Error(t, err)
		assert.Equal(t, 3, countRows(t, newMariaDBProxy(nil), table))
	})
}
