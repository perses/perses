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

package secret

import (
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query struct {
	databaseModel.Query
	// NamePrefix is a prefix of the Secret.metadata.name that is used to filter the list of the Secret.
	// NamePrefix can be empty in case you want to return the full list of Secret available.
	NamePrefix string `query:"name"`
	// Project is the exact name of the project.
	// The value can come from the path of the URL or from the query parameter
	Project string `param:"project" query:"project"`
}

type DAO interface {
	Create(entity *v1.Secret) error
	Update(entity *v1.Secret) error
	Delete(project string, name string) error

	DeleteAll(project string) error
	Get(project string, name string) (*v1.Secret, error)
	List(q *Query) ([]*v1.Secret, error)
}

type Service interface {
	apiInterface.Service[*v1.Secret, *v1.PublicSecret, *Query]
}
