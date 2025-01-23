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
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api"

	"github.com/brunoga/deep"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/schemas"
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

func (s *service) Create(_ apiInterface.PersesContext, entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.create(copyEntity)
}

func (s *service) create(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	// Refreshing RBAC cache as the role binding can add or remove new permissions to concerned users
	if err := s.rbac.Refresh(); err != nil {
		logrus.WithError(err).Error("failed to refresh RBAC cache")
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity *v1.GlobalRoleBinding, parameters apiInterface.Parameters) (*v1.GlobalRoleBinding, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.update(copyEntity, parameters)
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

	// If you do want to change the role for a binding, you need to remove the binding object and create a replacement.
	// More info at: https://github.com/perses/perses/blob/main/docs/auth/authorization.md#rolebinding-and-globalrolebinding-update-restriction
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

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (*v1.GlobalRoleBinding, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q *globalrolebinding.Query, _ apiInterface.Parameters) ([]*v1.GlobalRoleBinding, error) {
	return s.dao.List(q)
}

func (s *service) RawList(_ apiInterface.PersesContext, q *globalrolebinding.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	return s.dao.RawList(q)
}

func (s *service) MetadataList(_ apiInterface.PersesContext, q *globalrolebinding.Query, _ apiInterface.Parameters) ([]api.Entity, error) {
	return s.dao.MetadataList(q)
}

func (s *service) RawMetadataList(_ apiInterface.PersesContext, q *globalrolebinding.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	return s.dao.RawMetadataList(q)
}
