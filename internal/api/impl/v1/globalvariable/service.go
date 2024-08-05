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
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api"

	"github.com/brunoga/deep"
	apiInterface "github.com/perses/perses/internal/api/interface"

	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/schemas"
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

func (s *service) Create(_ apiInterface.PersesContext, entity *v1.GlobalVariable) (*v1.GlobalVariable, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.create(copyEntity)
}

func (s *service) create(entity *v1.GlobalVariable) (*v1.GlobalVariable, error) {
	if err := s.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
	}

	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity *v1.GlobalVariable, parameters apiInterface.Parameters) (*v1.GlobalVariable, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.update(copyEntity, parameters)
}

func (s *service) update(entity *v1.GlobalVariable, parameters apiInterface.Parameters) (*v1.GlobalVariable, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if err := s.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
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

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (*v1.GlobalVariable, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q *globalvariable.Query, _ apiInterface.Parameters) ([]*v1.GlobalVariable, error) {
	return s.dao.List(q)
}

func (s *service) RawList(_ apiInterface.PersesContext, q *globalvariable.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	return s.dao.RawList(q)
}

func (s *service) MetadataList(_ apiInterface.PersesContext, q *globalvariable.Query, _ apiInterface.Parameters) ([]api.Entity, error) {
	return s.dao.MetadataList(q)
}

func (s *service) RawMetadataList(_ apiInterface.PersesContext, q *globalvariable.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	return s.dao.RawMetadataList(q)
}
