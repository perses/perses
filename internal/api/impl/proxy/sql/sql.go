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

// Package sqlproxy implements the proxy executing read-only queries against the SQL datasources
// (datasource proxy kind "SQLProxy").
package sqlproxy

import (
	"context"
	"crypto/tls"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/go-sql-driver/mysql"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
	proxyCommon "github.com/perses/perses/internal/api/impl/proxy/common"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/netguard"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/common"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/sirupsen/logrus"
)

// sqlQuery is the body of a request to the SQL proxy.
type sqlQuery struct {
	Query string `json:"query"`
}

// errReadOnlyTx is returned by beginReadOnlyTx when the connection to the database is established,
// but the read-only transaction cannot be started.
var errReadOnlyTx = errors.New("unable to start a read-only transaction")

// beginReadOnlyTx connects to the database and starts a read-only transaction.
// The database is opened lazily: without connecting explicitly first, the errors to connect (network, TLS, authentication)
// could not be told apart from the ones to start the transaction (e.g. a database not supporting read-only transactions).
// The caller must roll back the transaction, then close the connection.
func beginReadOnlyTx(ctx context.Context, db *sql.DB) (*sql.Conn, *sql.Tx, error) {
	conn, err := db.Conn(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("unable to connect to the database: %w", err)
	}
	tx, err := conn.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("%w: %w", errReadOnlyTx, err)
	}
	return conn, tx, nil
}

// Proxy executes a read-only SQL query against a datasource (datasource proxy kind "SQLProxy").
// It must be built with New, once per request to serve.
//
// The query is checked to start with a read statement, then executed in a read-only transaction.
// Every connection to the database is verified by the Guard.
type Proxy struct {
	// Config is the SQL proxy configuration of the datasource (driver, host, database...). It is required.
	Config *datasourceSQL.Config
	// Secret contains the credentials and the TLS config used to reach the database. It must already be decrypted.
	// It can be nil.
	Secret *v1.SecretSpec
	// Name is the name of the datasource, used in the logs.
	Name string
	// Project is the project of the datasource, used in the logs. Empty for a global datasource.
	Project string
	// Path is the path of the request, only used in the error messages.
	Path string
	// Guard verifies every connection made to the database. It is required.
	Guard *netguard.Guard
	// username and password are extracted from the Secret when serving a request (see setupAuthentication).
	username string
	password string
}

// New returns the Proxy described by p, once verified it holds the settings required to serve requests safely:
// the config of the datasource and the Guard.
func New(p Proxy) (*Proxy, error) {
	if p.Config == nil {
		return nil, errors.New("the SQL config of the datasource is missing")
	}
	if p.Guard == nil {
		return nil, errors.New("the guard verifying the connections of the proxy is missing")
	}
	return &p, nil
}

func (s *Proxy) logWithDefaultEntry() *logrus.Entry {
	return logrus.WithFields(map[string]interface{}{
		proxyCommon.DatasourceFieldLog: s.Name,
		proxyCommon.ProjectFieldLog:    proxyCommon.ProjectForLog(s.Project),
	})
}

// Serve executes the SQL query sent in the body of the request of c (a POST request, see sqlQuery),
// and writes its result to c as JSON (see SQLResponse).
func (s *Proxy) Serve(c echo.Context) error {
	r := c.Request()

	// if this isn't a POST request don't perform the SQL query
	if r.Method != http.MethodPost {
		s.logWithDefaultEntry().WithField("method", r.Method).Error("SQL proxy requires POST request method when using SQLProxy kind")
		return echo.NewHTTPError(http.StatusMethodNotAllowed, fmt.Sprintf("you are not allowed to use this endpoint %q with the HTTP method %s", s.Path, r.Method))
	}

	// Validate query is read-only before proceeding
	q := &sqlQuery{}
	if err := json.NewDecoder(r.Body).Decode(q); err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to decode the query body")
		return apiinterface.HandleBadRequestError(err.Error())
	}

	// Sanitize and validate that the query is read-only (SELECT only) to prevent data modification
	// The cleaned query (without comments) is used for both validation and execution
	cleanQuery, isValid := sanitizeAndValidateQuery(q.Query)
	if !isValid {
		s.logWithDefaultEntry().WithField("query", q.Query).Error("rejected query not starting with a read statement keyword")
		return apiinterface.HandleBadRequestError(fmt.Sprintf("only read-only queries are allowed through the SQL proxy. The query must start with one of: %s, and must not contain INTO OUTFILE or INTO DUMPFILE", strings.Join(readOnlyStatementKeywords, ", ")))
	}

	// add password if provided
	if err := s.setupAuthentication(); err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to setup authentication")
		return apiinterface.InternalError
	}

	// add tls.Config
	tlsConfig, err := s.prepareTLSConfig()
	if err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to build the tls config")
		return apiinterface.InternalError
	}

	// get the correct SQL driver for address and open connection
	db, err := s.sqlOpen(tlsConfig)
	if err != nil {
		s.logWithDefaultEntry().WithError(err).WithField("driver", s.Config.Driver).Error("unable to open the database")
		return apiinterface.InternalError
	}
	defer func(db *sql.DB) {
		if err = db.Close(); err != nil {
			s.logWithDefaultEntry().WithError(err).Error("unable to close the database")
		}
	}(db)

	// Execute the query in a read-only transaction. The check above only looks at the first keyword of the query,
	// so it cannot catch every statement modifying data. For example, a data-modifying CTE (WITH d AS (DELETE ...) SELECT ...),
	// or EXPLAIN ANALYZE of a write statement in PostgreSQL.
	// In a read-only transaction, the database itself rejects any change to the data or the schema.
	// The transaction is always rolled back: there is nothing to commit.
	conn, tx, err := beginReadOnlyTx(r.Context(), db)
	if err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to execute the query in a read-only transaction")
		if errors.Is(err, errReadOnlyTx) {
			// The connection is established, but the database refuses the read-only transaction.
			// It happens with databases only compatible with the MySQL or PostgreSQL protocol.
			// The underlying error is logged server-side and not exposed to the client.
			return echo.NewHTTPError(http.StatusBadGateway, "unable to start a read-only transaction, which the SQL proxy requires for every query. See the server logs for details")
		}
		return apiinterface.InternalError
	}
	// The transaction must be rolled back before the connection is released: closing the connection waits for the transaction to end.
	defer func() {
		if rollbackErr := tx.Rollback(); rollbackErr != nil && !errors.Is(rollbackErr, sql.ErrTxDone) {
			s.logWithDefaultEntry().WithError(rollbackErr).Error("unable to roll back the read-only transaction")
		}
		if closeErr := conn.Close(); closeErr != nil && !errors.Is(closeErr, sql.ErrConnDone) {
			s.logWithDefaultEntry().WithError(closeErr).Error("unable to release the database connection")
		}
	}()

	// Execute the cleaned query (without comments) for safety
	rows, err := tx.QueryContext(r.Context(), cleanQuery)
	if err != nil {
		s.logWithDefaultEntry().WithError(err).WithField("query", cleanQuery).Error("unable to execute the query")
		return apiinterface.InternalError
	}
	defer func(rows *sql.Rows) {
		if err = rows.Close(); err != nil {
			s.logWithDefaultEntry().WithError(err).Error("unable to close rows")
		}
	}(rows)

	// write the SQL query result as JSON (for frontend consumption)
	if err = writeJSONResponse(c, rows, s.Name, s.Project); err != nil {
		s.logWithDefaultEntry().WithError(err).Error("unable to write the query result")
		return apiinterface.InternalError
	}

	return nil
}

func (s *Proxy) setupAuthentication() error {
	if s.Secret == nil {
		return nil
	}

	basicAuth := s.Secret.BasicAuth
	if basicAuth != nil {
		password, err := basicAuth.GetPassword()
		if err != nil {
			return err
		}
		s.username = basicAuth.Username
		s.password = password
	}

	return nil
}

// prepareTLSConfig returns the TLS config defined in the secret of the datasource, or nil if there is none.
// When there is none, the TLS behavior is defined by the datasource config (see buildMySQLConfig and buildPostgresConfig).
func (s *Proxy) prepareTLSConfig() (*tls.Config, error) {
	if s.Secret == nil || s.Secret.TLSConfig == nil {
		return nil, nil
	}
	return s.Secret.TLSConfig.BuildTLSConfig()
}

// SQLOpen opens a database specified by its database driver in the address
func (s *Proxy) sqlOpen(tlsConfig *tls.Config) (*sql.DB, error) {
	switch s.Config.Driver {
	case datasourceSQL.DriverMySQL, datasourceSQL.DriverMariaDB:
		return s.openMySQL(tlsConfig)
	case datasourceSQL.DriverPostgreSQL:
		return s.openPostgres(tlsConfig)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", s.Config.Driver)
	}
}

// open mySQL specific database connection
func (s *Proxy) openMySQL(tlsConfig *tls.Config) (*sql.DB, error) {
	mysqlConfig, err := s.buildMySQLConfig(tlsConfig)
	if err != nil {
		return nil, err
	}
	connector, err := mysql.NewConnector(mysqlConfig)
	if err != nil {
		return nil, fmt.Errorf("invalid MySQL configuration: %w", err)
	}
	return sql.OpenDB(connector), nil
}

func (s *Proxy) buildMySQLConfig(tlsConfig *tls.Config) (*mysql.Config, error) {
	// Start from the default config of the driver. For example, it allows the mysql_native_password authentication,
	// which is the default authentication method of MariaDB.
	baseConfig := mysql.NewConfig()
	baseConfig.Net = "tcp"
	baseConfig.Addr = s.Config.Host
	baseConfig.DBName = s.Config.Database
	baseConfig.User = s.username
	baseConfig.Passwd = s.password

	// Use MariaDB config if a driver is MariaDB, otherwise use MySQL config
	driverConfig := s.Config.MySQL
	if s.Config.MariaDB != nil {
		driverConfig = s.Config.MariaDB
	}

	if driverConfig != nil {
		dialTimeout, _ := common.ParseDuration(string(driverConfig.Timeout))
		readTimeout, _ := common.ParseDuration(string(driverConfig.ReadTimeout))
		writeTimeout, _ := common.ParseDuration(string(driverConfig.WriteTimeout))
		baseConfig.Params = driverConfig.Params
		if driverConfig.MaxAllowedPacket != 0 {
			baseConfig.MaxAllowedPacket = driverConfig.MaxAllowedPacket
		}
		baseConfig.Timeout = time.Duration(dialTimeout)
		baseConfig.ReadTimeout = time.Duration(readTimeout)
		baseConfig.WriteTimeout = time.Duration(writeTimeout)
	}

	// The params can contain options of the driver (e.g. parseTime, tls) as well as system variables.
	// Going through the DSN lets the driver interpret them exactly like in a DSN.
	mysqlConfig, err := mysql.ParseDSN(baseConfig.FormatDSN())
	if err != nil {
		return nil, fmt.Errorf("invalid MySQL configuration: %w", err)
	}

	// Every connection goes through the guard, so the SQL proxy cannot be used to reach a forbidden destination.
	// The driver bounds the dial with the configured timeout (if any) through the context.
	mysqlConfig.DialFunc = s.Guard.DialContext
	// Never allow multiple statements in a query, whatever the params say.
	// Otherwise, a query like "SELECT 1; COMMIT; DELETE FROM ..." would end the read-only transaction the query is executed in.
	mysqlConfig.MultiStatements = false
	// The host of the datasource is set by the user and can be a server they control.
	// Whatever the params say, never enable the options that let such a server:
	//   - read any file of the Perses server: with allowAllFiles, the driver sends the file requested by the server
	//     with LOAD DATA LOCAL INFILE, and the server can request it in response to any query.
	//   - get the password of the datasource in clear text (allowCleartextPasswords),
	//     or authenticate with the insecure old password method (allowOldPasswords).
	mysqlConfig.AllowAllFiles = false
	mysqlConfig.AllowCleartextPasswords = false
	mysqlConfig.AllowOldPasswords = false

	switch {
	case tlsConfig != nil:
		// The TLS config is set on the connection config directly, and not registered in the global registry of the driver
		// (mysql.RegisterTLSConfig). With the registry, concurrent requests to datasources registering the same name
		// could use the TLS config of each other.
		// If the server name is not set, the driver sets it from the host (unless InsecureSkipVerify is set).
		mysqlConfig.TLS = tlsConfig
	case driverConfig == nil || len(driverConfig.Params["tls"]) == 0:
		// No TLS config in the secret, and no "tls" param: TLS is required, and the certificate of the server is verified
		// with the system CAs. TLS can be disabled with the param "tls" set to "false".
		mysqlConfig.TLS = &tls.Config{MinVersion: tls.VersionTLS12, MaxVersion: tls.VersionTLS13}
	}
	return mysqlConfig, nil
}

// open postgres specific database connection
func (s *Proxy) openPostgres(tlsConfig *tls.Config) (*sql.DB, error) {
	connConfig, err := s.buildPostgresConfig(tlsConfig)
	if err != nil {
		return nil, err
	}
	// The connection pool is the one of database/sql, so the max number of connections must be set on it.
	db := stdlib.OpenDB(*connConfig)
	if s.Config.Postgres != nil && s.Config.Postgres.MaxConns > 0 {
		db.SetMaxOpenConns(int(s.Config.Postgres.MaxConns))
	}
	return db, nil
}

func (s *Proxy) buildPostgresConfig(tlsConfig *tls.Config) (*pgx.ConnConfig, error) {
	// build the postgres DSN for pgx to parse
	u := &url.URL{
		Scheme: "postgres",
		Host:   s.Config.Host,
		// The database needs a '/' prefix
		Path: "/" + s.Config.Database,
	}

	if s.username != "" && s.password == "" {
		u.User = url.User(s.username)
	}

	if s.username != "" && s.password != "" {
		u.User = url.UserPassword(s.username, s.password)
	}

	postgresConfig := s.Config.Postgres
	if postgresConfig == nil {
		postgresConfig = &datasourceSQL.PostgresConfig{}
	}

	query := url.Values{}

	if postgresConfig.Options != "" {
		query.Set("options", postgresConfig.Options)
	}

	// PrepareThreshold is intentionally not used: it is an option of the PostgreSQL JDBC driver, unknown to pgx.
	// pgx would send it to the server as a runtime parameter, and the server would reject the connection
	// with "unrecognized configuration parameter".

	if len(postgresConfig.ConnectTimeout) > 0 {
		// The connect timeout is a duration (e.g. "10s"), while pgx expects a number of seconds.
		connectTimeout, err := common.ParseDuration(string(postgresConfig.ConnectTimeout))
		if err != nil {
			return nil, fmt.Errorf("invalid connectTimeout: %w", err)
		}
		if seconds := int64(math.Ceil(time.Duration(connectTimeout).Seconds())); seconds > 0 {
			query.Set("connect_timeout", strconv.FormatInt(seconds, 10))
		}
	}

	if postgresConfig.SSLMode != "" {
		query.Set("sslmode", string(postgresConfig.SSLMode))
	}

	u.RawQuery = query.Encode()

	// pgx.ParseConfig and not pgxpool.ParseConfig: the connection is opened with stdlib.OpenDB,
	// so the pool settings of pgxpool (e.g. pool_max_conns) would not be used.
	connConfig, err := pgx.ParseConfig(u.String())
	if err != nil {
		logrus.WithError(err).Error("failed to parse postgres address")
		return nil, err
	}

	// Without TLS config in the secret, the TLS behavior is the one defined by the sslMode.
	if tlsConfig != nil {
		if postgresConfig.SSLMode == "" || postgresConfig.SSLMode == datasourceSQL.SSLModeDisable {
			return nil, errors.New("the secret of the datasource defines a TLS config, but the sslMode is not set or set to disable. Set the sslMode to require, verify-ca or verify-full")
		}
		applyPostgresTLSConfig(connConfig, tlsConfig)
	}

	// Every connection (including the fallbacks) goes through the guard,
	// so the SQL proxy cannot be used to reach a forbidden destination.
	// pgx resolves the hostname itself and dials the resolved IP addresses: the hostname is verified (allowed hosts,
	// denied networks) when it is resolved, and each IP address is verified when it is dialed.
	connConfig.LookupFunc = s.Guard.LookupHost
	connConfig.DialFunc = s.Guard.DialResolvedContext

	return connConfig, nil
}

// applyPostgresTLSConfig replaces the TLS config derived by pgx from the sslMode, with the TLS config of the secret.
// pgx derives one connection attempt per host, and depending on the sslMode, a fallback attempt (e.g. "prefer" tries with TLS, then without).
// The TLS config of the secret is used for every attempt using TLS. The attempts without TLS are kept as they are.
func applyPostgresTLSConfig(connConfig *pgx.ConnConfig, tlsConfig *tls.Config) {
	connConfig.TLSConfig = postgresTLSConfigForHost(connConfig.TLSConfig, tlsConfig, connConfig.Host)
	for _, fallback := range connConfig.Fallbacks {
		fallback.TLSConfig = postgresTLSConfigForHost(fallback.TLSConfig, tlsConfig, fallback.Host)
	}
}

func postgresTLSConfigForHost(derivedTLSConfig *tls.Config, tlsConfig *tls.Config, host string) *tls.Config {
	if derivedTLSConfig == nil {
		// This connection attempt doesn't use TLS.
		return nil
	}
	result := tlsConfig.Clone()
	// Unlike pgx, the TLS config of the secret doesn't necessarily define the server name.
	// Without it, the certificate of the server cannot be verified, and the TLS handshake fails.
	if result.ServerName == "" && !result.InsecureSkipVerify {
		result.ServerName = host
	}
	return result
}

// SQLColumnMetadata represents metadata for a single column in SQL result
type SQLColumnMetadata struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// SQLRow represents a single row in an SQL result with column name to value mapping
type SQLRow map[string]any

// SQLResponse represents the complete SQL query response
type SQLResponse struct {
	Columns []SQLColumnMetadata `json:"columns"`
	Rows    []SQLRow            `json:"rows"`
}

func writeJSONResponse(c echo.Context, rows *sql.Rows, datasourceName, projectName string) error {
	logFields := map[string]interface{}{
		proxyCommon.DatasourceFieldLog: datasourceName,
		proxyCommon.ProjectFieldLog:    proxyCommon.ProjectForLog(projectName),
	}
	cols, err := rows.Columns()
	if err != nil {
		logrus.WithError(err).WithFields(logFields).Error("unable to get columns from query result")
		return apiinterface.InternalError
	}

	colTypes, err := rows.ColumnTypes()
	if err != nil {
		logrus.WithError(err).WithFields(logFields).Error("unable to get column types from query result")
		return apiinterface.InternalError
	}

	// Build column metadata using proper struct
	columns := make([]SQLColumnMetadata, len(cols))
	for i, col := range cols {
		columns[i] = SQLColumnMetadata{
			Name: col,
			Type: colTypes[i].DatabaseTypeName(),
		}
	}

	// Create a slice of interface{} to hold the column values
	values := make([]any, len(cols))
	// Create a slice of interface{} pointers to hold references to actual column values
	scanArgs := make([]any, len(cols))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	// Collect all rows using a proper struct
	rowsData := make([]SQLRow, 0)
	for rows.Next() {
		err = rows.Scan(scanArgs...)
		if err != nil {
			logrus.WithError(err).WithFields(logFields).Error("unable to scan row from query result")
			return apiinterface.InternalError
		}

		row := make(SQLRow)
		for i, col := range cols {
			val := values[i]
			if val == nil {
				row[col] = nil
			} else {
				// Convert []byte to string for better JSON serialization
				if b, ok := val.([]byte); ok {
					row[col] = string(b)
				} else {
					row[col] = val
				}
			}
		}
		rowsData = append(rowsData, row)
	}

	// Build response using a proper struct
	response := SQLResponse{
		Columns: columns,
		Rows:    rowsData,
	}

	// Set Content-Type and write JSON response
	c.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	return c.JSON(http.StatusOK, response)
}

// sanitizeAndValidateQuery removes comments from a SQL query and validates it is read-only.
// Returns the cleaned query (without comments) and true if the query is safe to execute.
// Returns an empty string and false if the query contains write operations or is invalid.
// intoOutfilePattern matches SELECT ... INTO OUTFILE / INTO DUMPFILE, whatever the
// whitespace between the keywords (tab, newline, ...).
var intoOutfilePattern = regexp.MustCompile(`\bINTO\s+(OUTFILE|DUMPFILE)\b`)

// readOnlyStatementKeywords are the keywords a query sent to the SQL proxy is allowed to start with.
var readOnlyStatementKeywords = []string{"SELECT", "WITH", "SHOW", "DESCRIBE", "DESC", "EXPLAIN", "VALUES", "TABLE"}

func sanitizeAndValidateQuery(query string) (string, bool) {
	if query == "" {
		return "", false
	}

	// Normalize and remove comments
	normalizedQuery := strings.TrimSpace(query)
	if normalizedQuery == "" {
		return "", false
	}

	// Remove all comments to get a clean query for both validation and execution
	cleanQuery := removeSQLComments(normalizedQuery)
	cleanQuery = strings.TrimSpace(cleanQuery)

	// If nothing is left after removing comments, reject the query
	if cleanQuery == "" {
		return "", false
	}

	upperQuery := strings.ToUpper(cleanQuery)

	// Only allow the queries starting with a keyword of a read statement. It is an allowlist rather than a list of forbidden keywords,
	// as there are too many statements modifying data or the schema to list (e.g. CALL, DO, MERGE, COPY, RENAME, LOCK, ...).
	// Note that some statements modifying data can still start with one of these keywords, like a data-modifying CTE (WITH d AS (DELETE ...) SELECT ...)
	// or EXPLAIN ANALYZE of a write statement in PostgreSQL. That's why the query is also executed in a read-only transaction (see Proxy.Serve).
	// The keyword check remains required: in MySQL, a statement modifying the schema (e.g. RENAME TABLE) implicitly commits the current transaction,
	// and is then not executed in the read-only transaction.
	if !slices.Contains(readOnlyStatementKeywords, firstKeyword(upperQuery)) {
		return "", false
	}

	// Reject the file-writing forms of SELECT in MySQL / MariaDB. A read-only transaction
	// prevents changes to the tables, but both MySQL and MariaDB permit
	// SELECT ... INTO OUTFILE / INTO DUMPFILE inside a read-only transaction, so the
	// database itself does not stop it. With the FILE privilege of the datasource's
	// database user, such a query writes a file on the database host.
	// The check is text-based: a string literal containing the exact pattern
	// "INTO OUTFILE" / "INTO DUMPFILE" is rejected as well, which is an accepted trade-off.
	if intoOutfilePattern.MatchString(upperQuery) {
		return "", false
	}

	// Query is valid and read-only, return the cleaned version
	return cleanQuery, true
}

// firstKeyword returns the first word of the query, ignoring the opening parentheses (e.g. "(SELECT 1) UNION (SELECT 2)").
func firstKeyword(query string) string {
	query = strings.TrimLeft(query, "( \t\r\n\f\v")
	end := strings.IndexFunc(query, func(r rune) bool { return !unicode.IsLetter(r) })
	if end == -1 {
		return query
	}
	return query[:end]
}

// removeSQLComments removes SQL comments from a string
// Supports both -- single-line comments and /* */ multi-line comments
func removeSQLComments(query string) string {
	var result strings.Builder
	i := 0

	for i < len(query) {
		// Check for single-line comment (-- or #)
		if i+1 < len(query) && (query[i:i+2] == "--" || query[i:i+2] == "/*") {
			if query[i:i+2] == "--" {
				// Skip until the end of line
				for i < len(query) && query[i] != '\n' {
					i++
				}
				if i < len(query) {
					result.WriteByte('\n')
					i++
				}
			} else if query[i:i+2] == "/*" {
				// Skip until closing */
				i += 2
				for i+1 < len(query) {
					if query[i:i+2] == "*/" {
						i += 2
						break
					}
					i++
				}
			}
		} else if i < len(query) {
			result.WriteByte(query[i])
			i++
		}
	}

	return result.String()
}
