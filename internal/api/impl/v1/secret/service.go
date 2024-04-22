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
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	secret.Service
	dao    secret.DAO
	crypto crypto.Crypto
}

func NewService(dao secret.DAO, crypto crypto.Crypto) secret.Service {
	return &service{
		dao:    dao,
		crypto: crypto,
	}
}

func (s *service) Create(_ apiInterface.PersesContext, entity *v1.Secret) (*v1.PublicSecret, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.crypto.Encrypt(&entity.Spec); err != nil {
		logrus.WithError(err).Errorf("unable to encrypt the secret spec")
		return nil, apiInterface.InternalError
	}
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return v1.NewPublicSecret(entity), nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity *v1.Secret, parameters apiInterface.Parameters) (*v1.PublicSecret, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Secret %q and name from the http request: %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in Secret %q and project from the http request %q don't match", entity.Metadata.Project, parameters.Project)
		return nil, apiInterface.HandleBadRequestError("metadata.project and the project name in the http path request don't match")
	}
	// find the previous version of the Secret
	oldEntity, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)

	if encryptErr := s.crypto.Encrypt(&entity.Spec); encryptErr != nil {
		logrus.WithError(encryptErr).Errorf("unable to encrypt the secret spec")
		return nil, apiInterface.InternalError
	}
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the Secret %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return v1.NewPublicSecret(entity), nil
}

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Project, parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (*v1.PublicSecret, error) {
	scrt, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}
	return v1.NewPublicSecret(scrt), nil
}

func (s *service) List(_ apiInterface.PersesContext, q *secret.Query, params apiInterface.Parameters) ([]*v1.PublicSecret, error) {
	// Query is copied because it can be modified by the toolbox.go: listWhenPermissionIsActivated(...) and need to `q` need to keep initial value
	query := &secret.Query{
		Query:      q.Query,
		NamePrefix: q.NamePrefix,
		Project:    q.Project,
	}
	if len(query.Project) == 0 {
		query.Project = params.Project
	}
	l, err := s.dao.List(query)
	if err != nil {
		return nil, err
	}
	result := make([]*v1.PublicSecret, 0, len(l))
	for _, scrt := range l {
		result = append(result, v1.NewPublicSecret(scrt))
	}
	return result, nil
}
