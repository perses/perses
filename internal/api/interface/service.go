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
	"github.com/perses/perses/internal/api/shared/crypto"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
)

var (
	EmptyCtx = context{
		echoContext: nil,
		username:    "",
	}
)

func NewPersesContext(ctx echo.Context) PersesContext {
	claims := crypto.ExtractJWTClaims(ctx)
	username, _ := claims.GetSubject()
	return &context{
		echoContext: ctx,
		username:    username,
	}
}

type PersesContext interface {
	UpdateJWTEntry(key string, value string)
	GetUsername() string
}

type context struct {
	echoContext echo.Context
	username    string
}

func (c context) UpdateJWTEntry(key string, value string) {
	// TODO
}

func (c context) GetUsername() string {
	return c.username
}

type Parameters struct {
	Project string
	Name    string
}

type Service interface {
	Create(ctx PersesContext, entity api.Entity) (interface{}, error)
	Update(ctx PersesContext, entity api.Entity, parameters Parameters) (interface{}, error)
	Delete(ctx PersesContext, parameters Parameters) error
	Get(ctx PersesContext, parameters Parameters) (interface{}, error)
	List(ctx PersesContext, q databaseModel.Query, parameters Parameters) (interface{}, error)
}
