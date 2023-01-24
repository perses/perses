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
	"fmt"

	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/project"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

func generateProjectResourceQuery(kind v1.Kind, project string, name string) string {
	if len(project) == 0 {
		// it's used when we query a list of object. It can happen that the project is empty.
		return fmt.Sprintf("/%s", v1.PluralKindMap[kind])
	}
	return fmt.Sprintf("/%s/%s/%s", v1.PluralKindMap[kind], project, name)
}

func generateResourceQuery(kind v1.Kind, name string) string {
	return fmt.Sprintf("/%s/%s", v1.PluralKindMap[kind], name)
}

func buildQuery(query databaseModel.Query) (string, error) {
	switch qt := query.(type) {
	case *dashboard.Query:
		return generateProjectResourceQuery(v1.KindDashboard, qt.Project, qt.NamePrefix), nil
	case *datasource.Query:
		return generateProjectResourceQuery(v1.KindDatasource, qt.Project, qt.NamePrefix), nil
	case *folder.Query:
		return generateProjectResourceQuery(v1.KindFolder, qt.Project, qt.NamePrefix), nil
	case *globaldatasource.Query:
		return generateResourceQuery(v1.KindGlobalDatasource, qt.NamePrefix), nil
	case *project.Query:
		return generateResourceQuery(v1.KindProject, qt.NamePrefix), nil
	default:
		return "", fmt.Errorf("this type of query '%T' is not managed", qt)
	}
}
