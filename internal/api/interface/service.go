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

package apiinterface

import (
	"encoding/json"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/pkg/model/api"
)

type Parameters struct {
	Project string
	Name    string
}

type Service[T api.Entity, K api.Entity, V databaseModel.Query] interface {
	Create(ctx echo.Context, entity T) (K, error)
	Update(ctx echo.Context, entity T, parameters Parameters) (K, error)
	Delete(ctx echo.Context, parameters Parameters) error
	Get(parameters Parameters) (K, error)
	List(query V, parameters Parameters) ([]K, error)
	RawList(query V, parameters Parameters) ([]json.RawMessage, error)
	MetadataList(query V, parameters Parameters) ([]api.Entity, error)
	RawMetadataList(query V, parameters Parameters) ([]json.RawMessage, error)
}
