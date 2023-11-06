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

package variable

import (
	"fmt"
	"github.com/perses/perses/internal/api/shared/authorization"
	"github.com/perses/perses/internal/api/shared/crypto"

	"github.com/perses/perses/internal/api/shared/validate"

	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	variable.Service
	dao  variable.DAO
	rbac authorization.RBAC
	sch  schemas.Schemas
}

func NewService(dao variable.DAO, rbac authorization.RBAC, sch schemas.Schemas) variable.Service {
	return &service{
		dao:  dao,
		rbac: rbac,
		sch:  sch,
	}
}

func (s *service) Create(entity api.Entity, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if object, ok := entity.(*v1.Variable); ok {
		if err := authorization.CheckUserPermission(s.rbac, claims, v1.CreateAction, object.Metadata.Project, v1.KindVariable); err != nil {
			return nil, err
		}
		return s.create(object)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Variable format, received '%T'", entity))
}

func (s *service) create(entity *v1.Variable) (*v1.Variable, error) {
	if err := validate.Variable(entity, s.sch); err != nil {
		return nil, shared.HandleBadRequestError(err.Error())
	}
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.UpdateAction, parameters.Project, v1.KindVariable); err != nil {
		return nil, err
	}
	if object, ok := entity.(*v1.Variable); ok {
		return s.update(object, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Variable format, received '%T'", entity))
}

func (s *service) update(entity *v1.Variable, parameters shared.Parameters) (*v1.Variable, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Variable %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, shared.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in variable %q and project from the http request %q don't match", entity.Metadata.Project, parameters.Project)
		return nil, shared.HandleBadRequestError("metadata.project and the project name in the http path request don't match")
	}

	if err := s.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return nil, shared.HandleBadRequestError(err.Error())
	}

	// find the previous version of the Variable
	oldEntity, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the Variable %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters, claims *crypto.JWTCustomClaims) error {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.DeleteAction, parameters.Project, v1.KindVariable); err != nil {
		return err
	}
	return s.dao.Delete(parameters.Project, parameters.Name)
}

func (s *service) Get(parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.ReadAction, parameters.Project, v1.KindVariable); err != nil {
		return nil, err
	}
	return s.dao.Get(parameters.Project, parameters.Name)
}

func (s *service) List(q databaseModel.Query, parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.ReadAction, parameters.Project, v1.KindVariable); err != nil {
		return nil, err
	}
	return s.dao.List(q)
}
