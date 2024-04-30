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

package globalsecret

import (
	"fmt"

	"github.com/brunoga/deep"
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	globalsecret.Service
	dao    globalsecret.DAO
	crypto crypto.Crypto
}

func NewService(dao globalsecret.DAO, crypto crypto.Crypto) globalsecret.Service {
	return &service{
		dao:    dao,
		crypto: crypto,
	}
}

func (s *service) Create(_ apiInterface.PersesContext, entity *v1.GlobalSecret) (*v1.PublicGlobalSecret, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.create(copyEntity)
}

func (s *service) create(entity *v1.GlobalSecret) (*v1.PublicGlobalSecret, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.crypto.Encrypt(&entity.Spec); err != nil {
		logrus.WithError(err).Errorf("unable to encrypt the secret spec")
		return nil, apiInterface.InternalError
	}
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return v1.NewPublicGlobalSecret(entity), nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity *v1.GlobalSecret, parameters apiInterface.Parameters) (*v1.PublicGlobalSecret, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.update(copyEntity, parameters)
}

func (s *service) update(entity *v1.GlobalSecret, parameters apiInterface.Parameters) (*v1.PublicGlobalSecret, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in GlobalSecret %q and name from the http request: %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	// find the previous version of the GlobalSecret
	oldEntity, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)

	if encryptErr := s.crypto.Encrypt(&entity.Spec); encryptErr != nil {
		logrus.WithError(encryptErr).Errorf("unable to encrypt the secret spec")
		return nil, apiInterface.InternalError
	}
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the GlobalSecret %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return v1.NewPublicGlobalSecret(entity), nil
}

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (*v1.PublicGlobalSecret, error) {
	scrt, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}
	return v1.NewPublicGlobalSecret(scrt), nil
}

func (s *service) List(_ apiInterface.PersesContext, q *globalsecret.Query, _ apiInterface.Parameters) ([]*v1.PublicGlobalSecret, error) {
	l, err := s.dao.List(q)
	if err != nil {
		return nil, err
	}
	result := make([]*v1.PublicGlobalSecret, 0, len(l))
	for _, scrt := range l {
		result = append(result, v1.NewPublicGlobalSecret(scrt))
	}
	return result, nil
}
