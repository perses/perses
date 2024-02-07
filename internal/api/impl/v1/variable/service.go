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

	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/validate"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	variable.Service
	dao variable.DAO
	sch schemas.Schemas
}

func NewService(dao variable.DAO, sch schemas.Schemas) variable.Service {
	return &service{
		dao: dao,
		sch: sch,
	}
}

func (s *service) Create(_ apiInterface.PersesContext, entity api.Entity) (interface{}, error) {
	if object, ok := entity.(*v1.Variable); ok {
		return s.create(object)
	}
	return nil, apiInterface.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Variable format, received '%T'", entity))
}

func (s *service) create(entity *v1.Variable) (*v1.Variable, error) {
	if err := validate.Variable(entity, s.sch); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
	}
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity api.Entity, parameters apiInterface.Parameters) (interface{}, error) {
	if object, ok := entity.(*v1.Variable); ok {
		return s.update(object, parameters)
	}
	return nil, apiInterface.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Variable format, received '%T'", entity))
}

func (s *service) update(entity *v1.Variable, parameters apiInterface.Parameters) (*v1.Variable, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Variable %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in variable %q and project from the http request %q don't match", entity.Metadata.Project, parameters.Project)
		return nil, apiInterface.HandleBadRequestError("metadata.project and the project name in the http path request don't match")
	}

	if err := s.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
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

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Project, parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (interface{}, error) {
	return s.dao.Get(parameters.Project, parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q databaseModel.Query, _ apiInterface.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
