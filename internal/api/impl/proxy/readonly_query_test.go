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

func TestProjectForLog(t *testing.T) {
	tests := []struct {
		name     string
		project  string
		expected string
	}{
		{
			name:     "empty project returns global marker",
			project:  "",
			expected: "<global>",
		},
		{
			name:     "non-empty project returns project name",
			project:  "my-project",
			expected: "my-project",
		},
		{
			name:     "whitespace-only project is not treated as empty",
			project:  "  ",
			expected: "  ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := projectForLog(tt.project)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSanitizeAndValidateQuery(t *testing.T) {
	tests := []struct {
		name          string
		query         string
		expectedValid bool
		expectClean   bool // whether we should check that cleanQuery is not empty
	}{
		// Valid read-only queries
		{
			name:          "simple SELECT",
			query:         "SELECT * FROM users",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with WHERE",
			query:         "SELECT id, name FROM users WHERE id = 1",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with JOIN",
			query:         "SELECT u.id, o.order_id FROM users u JOIN orders o ON u.id = o.user_id",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with GROUP BY",
			query:         "SELECT department, COUNT(*) FROM employees GROUP BY department",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with ORDER BY",
			query:         "SELECT * FROM products ORDER BY price DESC",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with LIMIT",
			query:         "SELECT * FROM logs LIMIT 100 OFFSET 10",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with single-line comment - comment is removed",
			query:         "-- get all users\nSELECT * FROM users",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with multi-line comment - comment is removed",
			query:         "/* get all users */ SELECT * FROM users",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with leading whitespace",
			query:         "   \n   SELECT * FROM users",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "lowercase select",
			query:         "select * from users",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "mixed case select",
			query:         "SeLeCt * FrOm users",
			expectedValid: true,
			expectClean:   true,
		},
		// Invalid queries with write operations
		{
			name:          "INSERT query",
			query:         "INSERT INTO users (name) VALUES ('John')",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "UPDATE query",
			query:         "UPDATE users SET name = 'Jane' WHERE id = 1",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "DELETE query",
			query:         "DELETE FROM users WHERE id = 1",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "DROP TABLE query",
			query:         "DROP TABLE users",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "ALTER TABLE query",
			query:         "ALTER TABLE users ADD COLUMN email VARCHAR(255)",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "CREATE TABLE query",
			query:         "CREATE TABLE users (id INT PRIMARY KEY)",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "TRUNCATE query",
			query:         "TRUNCATE TABLE users",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "REPLACE query",
			query:         "REPLACE INTO users VALUES (1, 'John')",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "GRANT query",
			query:         "GRANT SELECT ON users TO role_name",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "REVOKE query",
			query:         "REVOKE SELECT ON users FROM role_name",
			expectedValid: false,
			expectClean:   false,
		},
		// Dangerous queries hidden in comments - comments are removed so the query is safe
		{
			name:          "DELETE in single-line comment with SELECT (now safe after comment removal)",
			query:         "-- DELETE FROM users\nSELECT * FROM users",
			expectedValid: true, // After removing comment, only SELECT remains
			expectClean:   true,
		},
		{
			name:          "INSERT after multi-line comment prefix",
			query:         "/* comment */ INSERT INTO users VALUES (1)",
			expectedValid: false, // After removing comment, INSERT remains
			expectClean:   false,
		},
		{
			name:          "UPDATE after multi-line comment",
			query:         "/* multi\nline\ncomment */ UPDATE users SET name = 'John'",
			expectedValid: false, // After removing comment, UPDATE remains
			expectClean:   false,
		},
		// Edge cases
		{
			name:          "empty query",
			query:         "",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "whitespace only should be rejected",
			query:         "   \n  \t  ",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "comment with no actual query should be rejected",
			query:         "-- just a comment",
			expectedValid: false,
			expectClean:   false,
		},
		{
			name:          "multi-line comment with no actual query should be rejected",
			query:         "/* just a comment */",
			expectedValid: false,
			expectClean:   false,
		},
		// Query strings with writing keywords not at the start
		{
			name:          "SELECT with DELETE in string literal",
			query:         "SELECT name FROM users WHERE description LIKE '%DELETE%'",
			expectedValid: true,
			expectClean:   true,
		},
		{
			name:          "SELECT with INSERT in column name reference",
			query:         "SELECT user_insert_date FROM users",
			expectedValid: true,
			expectClean:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cleanQuery, isValid := sanitizeAndValidateQuery(tt.query)
			assert.Equal(t, tt.expectedValid, isValid, "query: %q", tt.query)
			if tt.expectClean {
				assert.NotEmpty(t, cleanQuery, "expected non-empty clean query for: %q", tt.query)
			} else {
				assert.Empty(t, cleanQuery, "expected empty clean query for: %q", tt.query)
			}
		})
	}
}

func TestSanitizeAndValidateQuery_CleanQueryOutput(t *testing.T) {
	// Test that the cleaned query has comments removed
	tests := []struct {
		name               string
		query              string
		expectedCleanQuery string
		expectedValid      bool
	}{
		{
			name:               "single-line comment removed",
			query:              "-- comment\nSELECT * FROM users",
			expectedCleanQuery: "SELECT * FROM users",
			expectedValid:      true,
		},
		{
			name:               "multi-line comment removed",
			query:              "/* comment */ SELECT * FROM users",
			expectedCleanQuery: "SELECT * FROM users",
			expectedValid:      true,
		},
		{
			name:               "inline comment removed",
			query:              "SELECT * FROM users /* where id = 1 */",
			expectedCleanQuery: "SELECT * FROM users",
			expectedValid:      true,
		},
		{
			name:               "multiple comments removed",
			query:              "-- first\n/* second */ SELECT * FROM users -- third",
			expectedCleanQuery: "SELECT * FROM users",
			expectedValid:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cleanQuery, isValid := sanitizeAndValidateQuery(tt.query)
			assert.Equal(t, tt.expectedValid, isValid)
			// The clean query should be trimmed and have comments removed
			assert.Equal(t, tt.expectedCleanQuery, cleanQuery)
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
