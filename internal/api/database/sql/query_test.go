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

package databasesql

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateProjectResourceSelectQuery(t *testing.T) {
	testSuite := []struct {
		title    string
		project  string
		projects []string
		name     string
		sqlQuery string
		sqlArgs  []any
	}{
		{
			title:    "no project with a prefix name",
			project:  "",
			name:     "test",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ?",
			sqlArgs:  []any{"test%"},
		},
		{
			title:    "with a prefix name",
			project:  "",
			name:     "test",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ?",
			sqlArgs:  []any{"test%"},
		},
		{
			title:    "a project with a prefix name",
			project:  "foo",
			name:     "bar",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ? AND project = ?",
			sqlArgs:  []any{"bar%", "foo"},
		},
		{
			title:    "a prefix name with an underscore is escaped",
			project:  "",
			name:     "foo_bar",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ?",
			sqlArgs:  []any{`foo\_bar%`},
		},
		{
			title:    "a prefix name with a percent sign is escaped",
			project:  "",
			name:     "100%",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ?",
			sqlArgs:  []any{`100\%%`},
		},
		{
			title:    "a prefix name with a backslash is escaped",
			project:  "",
			name:     `foo\bar`,
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ?",
			sqlArgs:  []any{`foo\\bar%`},
		},
		{
			title:    "empty query",
			project:  "",
			name:     "",
			sqlQuery: "SELECT doc FROM perses.dashboard",
		},
		{
			title:    "several projects",
			projects: []string{"foo", "bar"},
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE project IN (?, ?)",
			sqlArgs:  []any{"foo", "bar"},
		},
		{
			title:    "several projects with a prefix name",
			projects: []string{"foo", "bar"},
			name:     "test",
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE name LIKE ? AND project IN (?, ?)",
			sqlArgs:  []any{"test%", "foo", "bar"},
		},
		{
			title:    "several projects are lowercased as the database is case-insensitive",
			projects: []string{"Foo", "BAR"},
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE project IN (?, ?)",
			sqlArgs:  []any{"foo", "bar"},
		},
		{
			title:    "a project restricted by several projects",
			project:  "foo",
			projects: []string{"foo", "bar"},
			sqlQuery: "SELECT doc FROM perses.dashboard WHERE project = ? AND project IN (?, ?)",
			sqlArgs:  []any{"foo", "foo", "bar"},
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			d := &DAO{}
			sqlQuery, args := d.generateSelectQuery("perses.dashboard", test.project, test.projects, test.name)
			assert.Equal(t, test.sqlQuery, sqlQuery)
			assert.Equal(t, test.sqlArgs, args)
		})
	}
}

func TestGenerateProjectResourceDeleteQuery(t *testing.T) {
	testSuite := []struct {
		title         string
		caseSensitive bool
		project       string
		projects      []string
		name          string
		sqlQuery      string
		sqlArgs       []any
	}{
		{
			title:    "a project",
			project:  "foo",
			sqlQuery: "DELETE FROM perses.dashboard WHERE project = ?",
			sqlArgs:  []any{"foo"},
		},
		{
			title:    "several projects with a prefix name",
			projects: []string{"foo", "bar"},
			name:     "test",
			sqlQuery: "DELETE FROM perses.dashboard WHERE name LIKE ? AND project IN (?, ?)",
			sqlArgs:  []any{"test%", "foo", "bar"},
		},
		{
			title:         "several projects are kept as is as the database is case-sensitive",
			caseSensitive: true,
			projects:      []string{"Foo", "bar"},
			sqlQuery:      "DELETE FROM perses.dashboard WHERE project IN (?, ?)",
			sqlArgs:       []any{"Foo", "bar"},
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			d := &DAO{CaseSensitive: test.caseSensitive}
			sqlQuery, args := d.generateDeleteQuery("perses.dashboard", test.project, test.projects, test.name)
			assert.Equal(t, test.sqlQuery, sqlQuery)
			assert.Equal(t, test.sqlArgs, args)
		})
	}
}
