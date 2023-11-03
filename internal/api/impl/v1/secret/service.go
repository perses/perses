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

package secret

import (
	"fmt"
	"github.com/perses/perses/internal/api/shared/authorization"

	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/crypto"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	secret.Service
	dao    secret.DAO
	crypto crypto.Crypto
	rbac   authorization.RBAC
}

func NewService(dao secret.DAO, crypto crypto.Crypto, rbac authorization.RBAC) secret.Service {
	return &service{
		dao:    dao,
		crypto: crypto,
		rbac:   rbac,
	}
}

func (s *service) Create(entity api.Entity, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if object, ok := entity.(*v1.Secret); ok {
		return s.create(object)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Secret format, received '%T'", entity))
}

func (s *service) create(entity *v1.Secret) (*v1.PublicSecret, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.crypto.Encrypt(&entity.Spec); err != nil {
		logrus.WithError(err).Errorf("unable to encrypt the secret spec")
		return nil, shared.InternalError
	}
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return v1.NewPublicSecret(entity), nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if object, ok := entity.(*v1.Secret); ok {
		return s.update(object, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting Secret format, received '%T'", entity))
}

func (s *service) update(entity *v1.Secret, parameters shared.Parameters) (*v1.PublicSecret, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Secret %q and name from the http request: %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, shared.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in Secret %q and project from the http request %q don't match", entity.Metadata.Project, parameters.Project)
		return nil, shared.HandleBadRequestError("metadata.project and the project name in the http path request don't match")
	}
	// find the previous version of the Secret
	oldEntity, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)

	if encryptErr := s.crypto.Encrypt(&entity.Spec); encryptErr != nil {
		logrus.WithError(encryptErr).Errorf("unable to encrypt the secret spec")
		return nil, shared.InternalError
	}
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the Secret %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return v1.NewPublicSecret(entity), nil
}

func (s *service) Delete(parameters shared.Parameters, claims *crypto.JWTCustomClaims) error {
	return s.dao.Delete(parameters.Project, parameters.Name)
}

func (s *service) Get(parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	scrt, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}
	return v1.NewPublicSecret(scrt), nil
}

func (s *service) List(q databaseModel.Query, _ shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	l, err := s.dao.List(q)
	if err != nil {
		return nil, err
	}
	result := make([]*v1.PublicSecret, 0, len(l))
	for _, scrt := range l {
		result = append(result, v1.NewPublicSecret(scrt))
	}
	return result, nil
}
