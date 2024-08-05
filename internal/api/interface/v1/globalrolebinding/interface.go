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

package globalrolebinding

import (
	"encoding/json"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query struct {
	databaseModel.Query
	// NamePrefix is a prefix of the GlobalRoleBinding.metadata.name that is used to filter the list of the GlobalRoleBinding.
	// NamePrefix can be empty in case you want to return the full list of GlobalRoleBinding available.
	NamePrefix   string `query:"name"`
	MetadataOnly bool   `query:"metadata_only"`
}

func (q *Query) GetMetadataOnlyQueryParam() bool {
	return q.MetadataOnly
}

func (q *Query) IsRawQueryAllowed() bool {
	return true
}

func (q *Query) IsRawMetadataQueryAllowed() bool {
	return true
}

type DAO interface {
	Create(entity *v1.GlobalRoleBinding) error
	Update(entity *v1.GlobalRoleBinding) error
	Delete(name string) error
	Get(name string) (*v1.GlobalRoleBinding, error)
	List(q *Query) ([]*v1.GlobalRoleBinding, error)
	RawList(q *Query) ([]json.RawMessage, error)
	MetadataList(q *Query) ([]api.Entity, error)
	RawMetadataList(q *Query) ([]json.RawMessage, error)
}

type Service interface {
	apiInterface.Service[*v1.GlobalRoleBinding, *v1.GlobalRoleBinding, *Query]
}
