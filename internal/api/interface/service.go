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
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/pkg/model/api"
)

var (
	EmptyCtx = &context{
		username: "",
	}
)

func NewPersesContext(ctx echo.Context) PersesContext {
	claims := crypto.ExtractJWTClaims(ctx)
	if claims == nil {
		// Claim can be empty in anonymous endpoints
		return &context{}
	}
	username, _ := claims.GetSubject()
	return &context{
		username: username,
	}
}

type PersesContext interface {
	GetUsername() string
}

type context struct {
	username string
}

func (c context) GetUsername() string {
	return c.username
}

type Parameters struct {
	Project string
	Name    string
}

type Service[T api.Entity, K api.Entity, V databaseModel.Query] interface {
	Create(ctx PersesContext, entity T) (K, error)
	Update(ctx PersesContext, entity T, parameters Parameters) (K, error)
	Delete(ctx PersesContext, parameters Parameters) error
	Get(ctx PersesContext, parameters Parameters) (K, error)
	List(ctx PersesContext, q V, parameters Parameters) ([]K, error)
}
