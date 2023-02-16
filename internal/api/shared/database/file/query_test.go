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

package databaseFile

import (
	"testing"

	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/project"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/stretchr/testify/assert"
)

func TestBuildQuery(t *testing.T) {
	testSuite := []struct {
		title  string
		query  databaseModel.Query
		expect string
	}{
		{
			title: "dashboardQuery",
			query: &dashboard.Query{
				NamePrefix: "meta",
				Project:    "perses",
			},
			expect: "/dashboards/perses/meta",
		},
		{
			title: "dashboardQuery with empty project",
			query: &dashboard.Query{
				NamePrefix: "meta",
			},
			expect: "/dashboards",
		},
		{
			title: "datasourceQuery",
			query: &datasource.Query{
				NamePrefix: "meta",
				Project:    "perses",
			},
			expect: "/datasources/perses/meta",
		},
		{
			title: "folderQuery",
			query: &folder.Query{
				NamePrefix: "meta",
				Project:    "perses",
			},
			expect: "/folders/perses/meta",
		},
		{
			title: "globalDatasourceQuery",
			query: &globaldatasource.Query{
				NamePrefix: "meta",
			},
			expect: "/globaldatasources/meta",
		},
		{
			title: "projectQuery",
			query: &project.Query{
				NamePrefix: "meta",
			},
			expect: "/projects/meta",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result, err := buildQuery(test.query)
			assert.NoError(t, err)
			assert.Equal(t, test.expect, result)
		})
	}
}
