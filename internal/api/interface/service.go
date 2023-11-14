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

package apiInterface

import (
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
)

type Parameters struct {
	Project string
	Name    string
}

type Service interface {
	Create(entity api.Entity) (interface{}, error)
	Update(entity api.Entity, parameters Parameters) (interface{}, error)
	Delete(parameters Parameters) error
	Get(parameters Parameters) (interface{}, error)
	List(q databaseModel.Query, parameters Parameters) (interface{}, error)
}
