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

package globalrolebinding

import (
	"fmt"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	globalrolebinding.Service
	dao           globalrolebinding.DAO
	globalRoleDAO globalrole.DAO
	userDAO       user.DAO
	rbac          rbac.RBAC
	sch           schemas.Schemas
}

func NewService(dao globalrolebinding.DAO, globalRoleDAO globalrole.DAO, userDAO user.DAO, rbac rbac.RBAC, sch schemas.Schemas) globalrolebinding.Service {
	return &service{
		dao:           dao,
		globalRoleDAO: globalRoleDAO,
		userDAO:       userDAO,
		rbac:          rbac,
		sch:           sch,
	}
}

func (s *service) Create(_ apiInterface.PersesContext, entity api.Entity) (interface{}, error) {
	if object, ok := entity.(*v1.GlobalRoleBinding); ok {
		return s.create(object)
	}
	return nil, apiInterface.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting GlobalroleBinding format, received '%T'", entity))
}

func (s *service) create(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.validateGlobalRoleBinding(entity); err != nil {
		return nil, err
	}
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	// Refreshing RBAC cache as the role binding can add or remove new permissions to concerned users
	if err := s.rbac.Refresh(); err != nil {
		logrus.WithError(err).Error("failed to refresh RBAC cache")
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity api.Entity, parameters apiInterface.Parameters) (interface{}, error) {
	if object, ok := entity.(*v1.GlobalRoleBinding); ok {
		return s.update(object, parameters)
	}
	return nil, apiInterface.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting GlobalroleBinding format, received '%T'", entity))
}

func (s *service) update(entity *v1.GlobalRoleBinding, parameters apiInterface.Parameters) (*v1.GlobalRoleBinding, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}

	// find the previous version of the GlobalRoleBinding
	oldEntity, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}

	if err := s.validateGlobalRoleBinding(entity); err != nil {
		return nil, err
	}

	// If you do want to change the role for a binding, you need to remove the binding object and create a replacement.
	// More info at: https://github.com/perses/perses/blob/main/docs/authorization.md#rolebinding-and-globalrolebinding-update-restriction
	if entity.Spec.Role != oldEntity.Spec.Role {
		return nil, apiInterface.HandleBadRequestError("spec.role can't be updated")
	}

	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the GlobalroleBinding %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}

	// Refreshing RBAC cache as the role binding can add or remove new permissions to concerned users
	if err := s.rbac.Refresh(); err != nil {
		logrus.WithError(err).Error("failed to refresh RBAC cache")
	}
	return entity, nil
}

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	if err := s.dao.Delete(parameters.Name); err != nil {
		return err
	}
	// Refreshing RBAC cache as the role binding can add or remove new permissions to concerned users
	if err := s.rbac.Refresh(); err != nil {
		logrus.WithError(err).Error("failed to refresh RBAC cache")
	}
	return nil
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (interface{}, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q databaseModel.Query, _ apiInterface.Parameters) (interface{}, error) {
	return s.dao.List(q)
}

// Validating role and subjects are existing
func (s *service) validateGlobalRoleBinding(globalRoleBinding *v1.GlobalRoleBinding) error {
	if _, err := s.globalRoleDAO.Get(globalRoleBinding.Spec.Role); err != nil {
		return apiInterface.HandleBadRequestError(fmt.Sprintf("global role %q doesn't exist", globalRoleBinding.Spec.Role))
	}

	for _, subject := range globalRoleBinding.Spec.Subjects {
		if subject.Kind == v1.KindUser {
			if _, err := s.userDAO.Get(subject.Name); err != nil {
				if databaseModel.IsKeyNotFound(err) {
					return apiInterface.HandleBadRequestError(fmt.Sprintf("user subject name %q doesn't exist", subject.Name))
				}
				logrus.WithError(err).Errorf("unable to find the user with the name %q", subject.Name)
				return err
			}
		}
	}
	return nil
}
