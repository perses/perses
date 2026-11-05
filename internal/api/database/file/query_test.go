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

package databasefile

import (
	"path/filepath"
	"testing"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/stretchr/testify/assert"
)

func TestBuildQuery(t *testing.T) {
	testSuite := []struct {
		title              string
		query              databaseModel.Query
		expectedPaths      []string
		expectedNamePrefix string
	}{
		{
			title: "dashboardQuery",
			query: &dashboard.Query{
				NamePrefix: "meta",
				Project:    "perses",
			},
			expectedPaths:      []string{filepath.Join("dashboards", "perses")},
			expectedNamePrefix: "meta",
		},
		{
			title: "dashboardQuery with empty project",
			query: &dashboard.Query{
				NamePrefix: "meta",
			},
			expectedPaths:      []string{"dashboards"},
			expectedNamePrefix: "meta",
		},
		{
			title: "datasourceQuery",
			query: &datasource.Query{
				NamePrefix: "meta",
				Project:    "perses",
			},
			expectedPaths:      []string{filepath.Join("datasources", "perses")},
			expectedNamePrefix: "meta",
		},
		{
			title: "folderQuery",
			query: &folder.Query{
				NamePrefix: "meta",
				Project:    "perses",
			},
			expectedPaths:      []string{filepath.Join("folders", "perses")},
			expectedNamePrefix: "meta",
		},
		{
			title: "dashboardQuery with several projects",
			query: &dashboard.Query{
				NamePrefix: "meta",
				Projects:   []string{"perses", "Demo"},
			},
			expectedPaths:      []string{filepath.Join("dashboards", "perses"), filepath.Join("dashboards", "demo")},
			expectedNamePrefix: "meta",
		},
		{
			title: "dashboardQuery with a project among several projects",
			query: &dashboard.Query{
				Project:  "perses",
				Projects: []string{"Perses", "demo"},
			},
			expectedPaths: []string{filepath.Join("dashboards", "perses")},
		},
		{
			title: "dashboardQuery with a project not among several projects",
			query: &dashboard.Query{
				Project:  "perses",
				Projects: []string{"demo"},
			},
			expectedPaths: []string{},
		},
		{
			title: "globalDatasourceQuery",
			query: &globaldatasource.Query{
				NamePrefix: "meta",
			},
			expectedPaths:      []string{"globaldatasources"},
			expectedNamePrefix: "meta",
		},
		{
			title: "projectQuery",
			query: &project.Query{
				NamePrefix: "meta",
			},
			expectedPaths:      []string{"projects"},
			expectedNamePrefix: "meta",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			d := &DAO{Folder: ""}
			result, prefix, err := d.buildQuery(test.query)
			assert.NoError(t, err)
			assert.ElementsMatch(t, test.expectedPaths, result)
			assert.Equal(t, test.expectedNamePrefix, prefix)
		})
	}
}

func TestBuildQueryRejectsInvalidProjects(t *testing.T) {
	d := &DAO{Folder: ""}
	_, _, err := d.buildQuery(&dashboard.Query{Projects: []string{"perses", "../secret"}})
	assert.True(t, databaseModel.IsKeyBadRequest(err))
}
