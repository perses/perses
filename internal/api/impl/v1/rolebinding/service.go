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

package rolebinding

import (
	"fmt"

	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	rolebinding.Service
	dao rolebinding.DAO
	sch schemas.Schemas
}

func NewService(dao rolebinding.DAO, sch schemas.Schemas) rolebinding.Service {
	return &service{
		dao: dao,
		sch: sch,
	}
}

func (s *service) Create(entity api.Entity) (interface{}, error) {
	if object, ok := entity.(*v1.RoleBinding); ok {
		return s.create(object)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting roleBinding format, received '%T'", entity))
}

func (s *service) create(entity *v1.RoleBinding) (*v1.RoleBinding, error) {
	// TODO: validate user + role exists
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters) (interface{}, error) {
	if object, ok := entity.(*v1.RoleBinding); ok {
		return s.update(object, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting roleBinding format, received '%T'", entity))
}

func (s *service) update(entity *v1.RoleBinding, parameters shared.Parameters) (*v1.RoleBinding, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in roleBinding %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, shared.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in roleBinding %q and project from the http request %q don't match", entity.Metadata.Project, parameters.Project)
		return nil, shared.HandleBadRequestError("metadata.project and the project name in the http path request don't match")
	}

	// TODO: validate user + role exists

	// find the previous version of the roleBinding
	oldEntity, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}

	// If you do want to change the role for a binding, you need to remove the binding object and create a replacement.
	// More info at: https://github.com/perses/perses/blob/main/docs/authorization.md#rolebinding-and-globalrolebinding-update-restriction
	if entity.Spec.Role != oldEntity.Spec.Role {
		return nil, shared.HandleBadRequestError("spec.role can't be updated")
	}

	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the roleBinding %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters) error {
	return s.dao.Delete(parameters.Project, parameters.Name)
}

func (s *service) Get(parameters shared.Parameters) (interface{}, error) {
	return s.dao.Get(parameters.Project, parameters.Name)
}

func (s *service) List(q databaseModel.Query, _ shared.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
