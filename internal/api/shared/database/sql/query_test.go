// Copyright 2023 The Perses Authors
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

package databaseSQL

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateResourceSelectQuery(t *testing.T) {
	testSuite := []struct {
		title    string
		name     string
		sqlQuery string
		sqlArgs  []interface{}
	}{
		{
			title:    "with a prefix name",
			name:     "test",
			sqlQuery: "SELECT doc FROM perses.project WHERE name LIKE ?",
			sqlArgs:  []interface{}{"test%"},
		},
		{
			title:    "empty query",
			name:     "",
			sqlQuery: "SELECT doc FROM perses.project",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			sqlQuery, args := generateResourceSelectQuery("perses.project", test.name)
			assert.Equal(t, test.sqlQuery, sqlQuery)
			assert.Equal(t, test.sqlArgs, args)
		})
	}
}

func TestGenerateProjectResourceSelectQuery(t *testing.T) {
	testSuite := []struct {
		title    string
		project  string
		name     string
		sqlQuery string
		sqlArgs  []interface{}
	}{
		{
			title:    "no project with a prefix name",
			project:  "",
			name:     "test",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ?",
			sqlArgs:  []interface{}{"test%"},
		},
		{
			title:    "a project with a prefix name",
			project:  "foo",
			name:     "bar",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ? AND project = ?",
			sqlArgs:  []interface{}{"bar%", "foo"},
		},
		{
			title:    "empty query",
			project:  "",
			name:     "",
			sqlQuery: "SELECT doc FROM perses.dashboard",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			sqlQuery, args := generateProjectResourceSelectQuery("perses.dashboard", test.project, test.name)
			assert.Equal(t, test.sqlQuery, sqlQuery)
			assert.Equal(t, test.sqlArgs, args)
		})
	}
}
