// Copyright 2021 The Perses Authors
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

package dashboard

import (
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query struct {
	databaseModel.Query
	// NamePrefix is a prefix of the Dashboard.metadata.name that is used to filter the list of the Dashboard.
	// NamePrefix can be empty in case you want to return the full list of Dashboard available.
	NamePrefix string `query:"name"`
	// Project is the exact name of the project.
	// The value can come from the path of the URL or from the query parameter
	Project string `param:"project" query:"project"`
}

type DAO interface {
	Create(entity *v1.Dashboard) error
	Update(entity *v1.Dashboard) error
	Delete(project string, name string) error
	DeleteAll(project string) error
	Get(project string, name string) (*v1.Dashboard, error)
	List(q databaseModel.Query) ([]*v1.Dashboard, error)
}

type Service interface {
	shared.ToolboxService
}
