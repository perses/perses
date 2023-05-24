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

package globalvariable

import (
	"fmt"

	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	globalvariable.Service
	dao globalvariable.DAO
	sch schemas.Schemas
}

func NewService(dao globalvariable.DAO, sch schemas.Schemas) globalvariable.Service {
	return &service{
		dao: dao,
		sch: sch,
	}
}

func (s *service) Create(entity api.Entity) (interface{}, error) {
	if datasourceObject, ok := entity.(*v1.GlobalVariable); ok {
		return s.create(datasourceObject)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Globalvariable format, received '%T'", entity))
}

func (s *service) create(entity *v1.GlobalVariable) (*v1.GlobalVariable, error) {
	if err := s.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return nil, shared.HandleBadRequestError(err.Error())
	}

	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters) (interface{}, error) {
	if DatasourceObject, ok := entity.(*v1.GlobalVariable); ok {
		return s.update(DatasourceObject, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Globalvariable format, received '%T'", entity))
}

func (s *service) update(entity *v1.GlobalVariable, parameters shared.Parameters) (*v1.GlobalVariable, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, shared.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if err := s.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return nil, shared.HandleBadRequestError(err.Error())
	}
	// find the previous version of the Datasource
	oldEntity, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the Globalvariable %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters) error {
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(parameters shared.Parameters) (interface{}, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(q databaseModel.Query, _ shared.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
