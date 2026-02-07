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

package proxy

import (
	"encoding/json"
	"testing"

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
