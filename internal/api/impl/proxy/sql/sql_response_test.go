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
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSQLResponseStructs(t *testing.T) {
	t.Run("SQLColumnMetadata marshals correctly", func(t *testing.T) {
		col := SQLColumnMetadata{
			Name: "user_id",
			Type: "INTEGER",
		}

		data, err := json.Marshal(col)
		require.NoError(t, err)

		expected := `{"name":"user_id","type":"INTEGER"}`
		assert.JSONEq(t, expected, string(data))
	})

	t.Run("SQLRow marshals correctly", func(t *testing.T) {
		row := SQLRow{
			"id":   1,
			"name": "test",
			"age":  30,
		}

		data, err := json.Marshal(row)
		require.NoError(t, err)

		var result map[string]any
		err = json.Unmarshal(data, &result)
		require.NoError(t, err)

		assert.Equal(t, float64(1), result["id"])
		assert.Equal(t, "test", result["name"])
		assert.Equal(t, float64(30), result["age"])
	})

	t.Run("SQLResponse marshals to correct JSON structure", func(t *testing.T) {
		response := SQLResponse{
			Columns: []SQLColumnMetadata{
				{Name: "id", Type: "INTEGER"},
				{Name: "name", Type: "VARCHAR"},
				{Name: "created_at", Type: "TIMESTAMP"},
			},
			Rows: []SQLRow{
				{
					"id":         1,
					"name":       "Alice",
					"created_at": "2024-01-01T00:00:00Z",
				},
				{
					"id":         2,
					"name":       "Bob",
					"created_at": "2024-01-02T00:00:00Z",
				},
			},
		}

		data, err := json.Marshal(response)
		require.NoError(t, err)

		expected := `{
			"columns": [
				{"name": "id", "type": "INTEGER"},
				{"name": "name", "type": "VARCHAR"},
				{"name": "created_at", "type": "TIMESTAMP"}
			],
			"rows": [
				{
					"id": 1,
					"name": "Alice",
					"created_at": "2024-01-01T00:00:00Z"
				},
				{
					"id": 2,
					"name": "Bob",
					"created_at": "2024-01-02T00:00:00Z"
				}
			]
		}`

		assert.JSONEq(t, expected, string(data))
	})

	t.Run("SQLResponse handles null values correctly", func(t *testing.T) {
		response := SQLResponse{
			Columns: []SQLColumnMetadata{
				{Name: "id", Type: "INTEGER"},
				{Name: "optional_field", Type: "VARCHAR"},
			},
			Rows: []SQLRow{
				{
					"id":             1,
					"optional_field": "value",
				},
				{
					"id":             2,
					"optional_field": nil,
				},
			},
		}

		data, err := json.Marshal(response)
		require.NoError(t, err)

		var result map[string]any
		err = json.Unmarshal(data, &result)
		require.NoError(t, err)

		rows := result["rows"].([]any)
		row2 := rows[1].(map[string]any)
		assert.Nil(t, row2["optional_field"])
	})

	t.Run("SQLResponse handles empty result set", func(t *testing.T) {
		response := SQLResponse{
			Columns: []SQLColumnMetadata{
				{Name: "id", Type: "INTEGER"},
				{Name: "name", Type: "VARCHAR"},
			},
			Rows: []SQLRow{},
		}

		data, err := json.Marshal(response)
		require.NoError(t, err)

		expected := `{
			"columns": [
				{"name": "id", "type": "INTEGER"},
				{"name": "name", "type": "VARCHAR"}
			],
			"rows": []
		}`

		assert.JSONEq(t, expected, string(data))
	})

	t.Run("SQLResponse unmarshal works correctly", func(t *testing.T) {
		jsonData := `{
			"columns": [
				{"name": "id", "type": "INTEGER"},
				{"name": "email", "type": "VARCHAR"}
			],
			"rows": [
				{"id": 1, "email": "alice@example.com"},
				{"id": 2, "email": "bob@example.com"}
			]
		}`

		var response SQLResponse
		err := json.Unmarshal([]byte(jsonData), &response)
		require.NoError(t, err)

		assert.Len(t, response.Columns, 2)
		assert.Equal(t, "id", response.Columns[0].Name)
		assert.Equal(t, "INTEGER", response.Columns[0].Type)

		assert.Len(t, response.Rows, 2)
		assert.Equal(t, float64(1), response.Rows[0]["id"])
		assert.Equal(t, "alice@example.com", response.Rows[0]["email"])
	})
}

// rowsConnector opens connections whose queries return the given rows of a single column "id",
// then fail with readErr (when set) instead of reporting the end of the result.
// It's what the databases do when a row cannot be computed, e.g. on a division by zero.
type rowsConnector struct {
	rows    []int64
	readErr error
}

func (c rowsConnector) Connect(context.Context) (driver.Conn, error) { return rowsConn(c), nil }
func (c rowsConnector) Driver() driver.Driver                        { return nil }

type rowsConn rowsConnector

func (c rowsConn) Prepare(string) (driver.Stmt, error) { return nil, errors.New("not implemented") }
func (c rowsConn) Close() error                        { return nil }
func (c rowsConn) Begin() (driver.Tx, error)           { return nil, errors.New("not implemented") }

func (c rowsConn) QueryContext(context.Context, string, []driver.NamedValue) (driver.Rows, error) {
	return &fakeRows{rows: c.rows, readErr: c.readErr}, nil
}

type fakeRows struct {
	rows    []int64
	readErr error
}

func (r *fakeRows) Columns() []string { return []string{"id"} }
func (r *fakeRows) Close() error      { return nil }

func (r *fakeRows) Next(dest []driver.Value) error {
	if len(r.rows) == 0 {
		if r.readErr != nil {
			return r.readErr
		}
		return io.EOF
	}
	dest[0] = r.rows[0]
	r.rows = r.rows[1:]
	return nil
}

func TestWriteJSONResponse(t *testing.T) {
	for _, test := range []struct {
		name         string
		connector    rowsConnector
		expectedBody string
		expectedErr  error
	}{
		{
			name:         "all rows read",
			connector:    rowsConnector{rows: []int64{1, 2}},
			expectedBody: `{"columns":[{"name":"id","type":""}],"rows":[{"id":1},{"id":2}]}`,
		},
		{
			name:        "error while reading the rows",
			connector:   rowsConnector{rows: []int64{1, 2}, readErr: errors.New("division by zero")},
			expectedErr: apiinterface.InternalError,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			db := sql.OpenDB(test.connector)
			defer func() { _ = db.Close() }()
			rows, err := db.Query("SELECT id FROM t")
			require.NoError(t, err)
			defer func() { _ = rows.Close() }()

			rec := httptest.NewRecorder()
			c := echo.New().NewContext(httptest.NewRequest(http.MethodPost, "/proxy", nil), rec)
			err = writeJSONResponse(c, rows, "sql", "perses")
			if test.expectedErr != nil {
				// The rows read before the error must not be returned as if they were the complete result.
				assert.Equal(t, test.expectedErr, err)
				assert.False(t, c.Response().Committed)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, test.expectedBody, rec.Body.String())
		})
	}
}
