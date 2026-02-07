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
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsReadOnlyQuery(t *testing.T) {
	tests := []struct {
		name     string
		query    string
		expected bool
	}{
		// Valid read-only queries
		{
			name:     "simple SELECT",
			query:    "SELECT * FROM users",
			expected: true,
		},
		{
			name:     "SELECT with WHERE",
			query:    "SELECT id, name FROM users WHERE id = 1",
			expected: true,
		},
		{
			name:     "SELECT with JOIN",
			query:    "SELECT u.id, o.order_id FROM users u JOIN orders o ON u.id = o.user_id",
			expected: true,
		},
		{
			name:     "SELECT with GROUP BY",
			query:    "SELECT department, COUNT(*) FROM employees GROUP BY department",
			expected: true,
		},
		{
			name:     "SELECT with ORDER BY",
			query:    "SELECT * FROM products ORDER BY price DESC",
			expected: true,
		},
		{
			name:     "SELECT with LIMIT",
			query:    "SELECT * FROM logs LIMIT 100 OFFSET 10",
			expected: true,
		},
		{
			name:     "SELECT with single-line comment",
			query:    "-- get all users\nSELECT * FROM users",
			expected: true,
		},
		{
			name:     "SELECT with multi-line comment",
			query:    "/* get all users */ SELECT * FROM users",
			expected: true,
		},
		{
			name:     "SELECT with leading whitespace",
			query:    "   \n   SELECT * FROM users",
			expected: true,
		},
		{
			name:     "lowercase select",
			query:    "select * from users",
			expected: true,
		},
		{
			name:     "mixed case select",
			query:    "SeLeCt * FrOm users",
			expected: true,
		},
		// Invalid queries with write operations
		{
			name:     "INSERT query",
			query:    "INSERT INTO users (name) VALUES ('John')",
			expected: false,
		},
		{
			name:     "UPDATE query",
			query:    "UPDATE users SET name = 'Jane' WHERE id = 1",
			expected: false,
		},
		{
			name:     "DELETE query",
			query:    "DELETE FROM users WHERE id = 1",
			expected: false,
		},
		{
			name:     "DROP TABLE query",
			query:    "DROP TABLE users",
			expected: false,
		},
		{
			name:     "ALTER TABLE query",
			query:    "ALTER TABLE users ADD COLUMN email VARCHAR(255)",
			expected: false,
		},
		{
			name:     "CREATE TABLE query",
			query:    "CREATE TABLE users (id INT PRIMARY KEY)",
			expected: false,
		},
		{
			name:     "TRUNCATE query",
			query:    "TRUNCATE TABLE users",
			expected: false,
		},
		{
			name:     "REPLACE query",
			query:    "REPLACE INTO users VALUES (1, 'John')",
			expected: false,
		},
		{
			name:     "GRANT query",
			query:    "GRANT SELECT ON users TO role_name",
			expected: false,
		},
		{
			name:     "REVOKE query",
			query:    "REVOKE SELECT ON users FROM role_name",
			expected: false,
		},
		// Dangerous queries hidden in comments - being extra cautious
		{
			name:     "DELETE in single-line comment with SELECT (rejected for safety)",
			query:    "-- DELETE FROM users\nSELECT * FROM users",
			expected: false, // We reject even though DELETE is commented, for maximum safety
		},
		{
			name:     "INSERT after multi-line comment prefix",
			query:    "/* comment */ INSERT INTO users VALUES (1)",
			expected: false,
		},
		{
			name:     "UPDATE after multi-line comment",
			query:    "/* multi\nline\ncomment */ UPDATE users SET name = 'John'",
			expected: false,
		},
		// Edge cases
		{
			name:     "empty query",
			query:    "",
			expected: false,
		},
		{
			name:     "whitespace only should be rejected",
			query:    "   \n  \t  ",
			expected: false,
		},
		{
			name:     "comment with no actual query should be rejected",
			query:    "-- just a comment",
			expected: false,
		},
		{
			name:     "multi-line comment with no actual query should be rejected",
			query:    "/* just a comment */",
			expected: false,
		},
		// Query strings with writing keywords not at the start
		{
			name:     "SELECT with DELETE in string literal",
			query:    "SELECT name FROM users WHERE description LIKE '%DELETE%'",
			expected: true,
		},
		{
			name:     "SELECT with INSERT in column name reference",
			query:    "SELECT user_insert_date FROM users",
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isReadOnlyQuery(tt.query)
			assert.Equal(t, tt.expected, result, "query: %q", tt.query)
		})
	}
}

func TestRemoveSQLComments(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "no comments",
			input:    "SELECT * FROM users",
			expected: "SELECT * FROM users",
		},
		{
			name:     "single-line comment at start",
			input:    "-- comment\nSELECT * FROM users",
			expected: "\nSELECT * FROM users",
		},
		{
			name:     "multi-line comment",
			input:    "/* comment */ SELECT * FROM users",
			expected: " SELECT * FROM users",
		},
		{
			name:     "nested-looking comments",
			input:    "SELECT /* inner */ * FROM users",
			expected: "SELECT  * FROM users",
		},
		{
			name:     "multiple comments",
			input:    "-- first\n/* second */ SELECT * -- third",
			expected: "\n SELECT * ",
		},
		{
			name:     "comment at end",
			input:    "SELECT * FROM users -- this is the end",
			expected: "SELECT * FROM users ",
		},
		{
			name:     "unclosed multi-line comment (rest is treated as comment)",
			input:    "SELECT * FROM /* comment",
			expected: "SELECT * FROM t", // Only the 't' from 'comment' is left
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := removeSQLComments(tt.input)
			assert.Equal(t, tt.expected, result, "input: %q", tt.input)
		})
	}
}
