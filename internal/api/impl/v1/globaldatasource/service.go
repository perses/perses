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
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/perses/perses/internal/api/validate"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	globaldatasource.Service
	dao globaldatasource.DAO
	sch schemas.Schemas
}

func NewService(dao globaldatasource.DAO, sch schemas.Schemas) globaldatasource.Service {
	return &service{
		dao: dao,
		sch: sch,
	}
}

func (s *service) Create(_ apiInterface.PersesContext, entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	if err := s.validate(entity); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
	}
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity *v1.GlobalDatasource, parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	if err := s.validate(entity); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
	}
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	// find the previous version of the Datasource
	oldEntity, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the GlobalDatasource %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q *globaldatasource.Query, _ apiInterface.Parameters) ([]*v1.GlobalDatasource, error) {
	dtsList, err := s.dao.List(q)
	if err != nil {
		return nil, err
	}
	return v1.FilterDatasource(q.Kind, q.Default, dtsList), nil
}

func (s *service) validate(entity *v1.GlobalDatasource) error {
	var list []*v1.GlobalDatasource
	if entity.Spec.Default {
		var err error
		list, err = s.dao.List(&globaldatasource.Query{})
		if err != nil {
			logrus.WithError(err).Errorf("unable to get the list of the global datasource")
			return err
		}
	}
	return validate.Datasource(entity, list, s.sch)
}
