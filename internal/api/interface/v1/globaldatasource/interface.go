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

package globaldatasource

import (
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query struct {
	etcd.Query
	// Name is a prefix of the GlobalDatasource.metadata.name that is used to filter the list of the GlobalDatasource.
	// Name can be empty in case you want to return the full list of GlobalDatasource available.
	Name string `query:"name"`
}

func (q *Query) Build() (string, error) {
	return v1.GenerateGlobalDatasourceID(q.Name), nil
}

type DAO interface {
	Create(entity *v1.GlobalDatasource) error
	Update(entity *v1.GlobalDatasource) error
	Delete(name string) error
	Get(name string) (*v1.GlobalDatasource, error)
	List(q etcd.Query) ([]*v1.GlobalDatasource, error)
}

type Service interface {
	shared.ToolboxService
}
