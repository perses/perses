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

package project

import (
	"fmt"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	project.Service
	dao project.DAO
}

func NewService(dao project.DAO) project.Service {
	return &service{
		dao: dao,
	}
}

func (s *service) Create(entity api.Entity) (interface{}, error) {
	if projectObject, ok := entity.(*v1.Project); ok {
		return s.create(projectObject)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting project format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) create(entity *v1.Project) (*v1.Project, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		if etcd.IsKeyConflict(err) {
			logrus.Debugf("unable to create the project %q. It already exits", entity.Metadata.Name)
			return nil, shared.ConflictError
		}
		logrus.WithError(err).Errorf("unable to perform the creation of the project %q, something wrong with etcd", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters) (interface{}, error) {
	if projectObject, ok := entity.(*v1.Project); ok {
		return s.update(projectObject, parameters)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting project format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) update(entity *v1.Project, parameters shared.Parameters) (*v1.Project, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in project %q and coming from the http request: %q doesn't match", entity.Metadata.Name, parameters.Name)
		return nil, fmt.Errorf("%w: metadata.name and the name in the http path request doesn't match", shared.BadRequestError)
	}
	// find the previous version of the project
	oldEntity, err := s.Get(parameters)
	if err != nil {
		return nil, err
	}
	oldObject := oldEntity.(*v1.Project)
	entity.Metadata.Update(oldObject.Metadata)
	if err := s.dao.Update(entity); err != nil {
		logrus.WithError(err).Errorf("unable to perform the update of the project %q, something wrong with etcd", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters) error {
	if err := s.dao.Delete(parameters.Name); err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the project %q", parameters.Name)
			return shared.NotFoundError
		}
		logrus.WithError(err).Errorf("unable to delete the project %q, something wrong with etcd", parameters.Name)
		return shared.InternalError
	}
	return nil
}

func (s *service) Get(parameters shared.Parameters) (interface{}, error) {
	entity, err := s.dao.Get(parameters.Name)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the project %q", parameters.Name)
			return nil, shared.NotFoundError
		}
		logrus.WithError(err).Errorf("unable to find the previous version of the project %q, something wrong with etcd", parameters.Name)
		return nil, shared.InternalError
	}
	return entity, nil
}

func (s *service) List(q etcd.Query, _ shared.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
