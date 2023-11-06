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
	"github.com/perses/perses/internal/api/shared/authorization"
	"github.com/perses/perses/internal/api/shared/crypto"

	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	globalrolebinding.Service
	dao  globalrolebinding.DAO
	rbac authorization.RBAC
	sch  schemas.Schemas
}

func NewService(dao globalrolebinding.DAO, rbac authorization.RBAC, sch schemas.Schemas) globalrolebinding.Service {
	return &service{
		dao:  dao,
		rbac: rbac,
		sch:  sch,
	}
}

func (s *service) Create(entity api.Entity, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.CreateAction, v1.GlobalProject, v1.KindGlobalRoleBinding); err != nil {
		return nil, err
	}
	if object, ok := entity.(*v1.GlobalRoleBinding); ok {
		return s.create(object)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting GlobalroleBinding format, received '%T'", entity))
}

func (s *service) create(entity *v1.GlobalRoleBinding) (*v1.GlobalRoleBinding, error) {
	// TODO: validate user + role exists
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.UpdateAction, v1.GlobalProject, v1.KindGlobalRoleBinding); err != nil {
		return nil, err
	}
	if object, ok := entity.(*v1.GlobalRoleBinding); ok {
		return s.update(object, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting GlobalroleBinding format, received '%T'", entity))
}

func (s *service) update(entity *v1.GlobalRoleBinding, parameters shared.Parameters) (*v1.GlobalRoleBinding, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, shared.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}

	// TODO: validate user + role exists
	// find the previous version of the Datasource
	oldEntity, err := s.dao.Get(parameters.Name)
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
		logrus.WithError(updateErr).Errorf("unable to perform the update of the GlobalroleBinding %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters, claims *crypto.JWTCustomClaims) error {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.DeleteAction, v1.GlobalProject, v1.KindGlobalRoleBinding); err != nil {
		return err
	}
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.ReadAction, v1.GlobalProject, v1.KindGlobalRoleBinding); err != nil {
		return nil, err
	}
	return s.dao.Get(parameters.Name)
}

func (s *service) List(q databaseModel.Query, _ shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.ReadAction, v1.GlobalProject, v1.KindGlobalRoleBinding); err != nil {
		return nil, err
	}
	return s.dao.List(q)
}
