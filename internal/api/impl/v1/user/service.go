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

package user

import (
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func hashAndSalt(pwd []byte) ([]byte, error) {
	return bcrypt.GenerateFromPassword(pwd, bcrypt.DefaultCost)
}

type service struct {
	user.Service
	dao user.DAO
}

func NewService(dao user.DAO) user.Service {
	return &service{
		dao: dao,
	}
}

func (s *service) Create(entity api.Entity) (interface{}, error) {
	if userObject, ok := entity.(*v1.User); ok {
		return s.create(userObject)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting user format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) create(entity *v1.User) (*v1.User, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	// check that the password is correctly filled
	if len(entity.Spec.Password) == 0 {
		return nil, fmt.Errorf("%w: password cannot be empty", shared.BadRequestError)
	}
	hash, err := hashAndSalt(entity.Spec.Password)
	if err != nil {
		logrus.WithError(err).Errorf("unable to generate the hash for the password of the user %s", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	// save the hash in the password field
	entity.Spec.Password = hash
	if err := s.dao.Create(entity); err != nil {
		if etcd.IsKeyConflict(err) {
			logrus.Debugf("unable to create the user '%s'. It already exits", entity.Metadata.Name)
			return nil, shared.ConflictError
		}
		logrus.WithError(err).Errorf("unable to perform the creation of the user '%s', something wrong with etcd", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	// once the user is stored, remove the password so it won't be leaked
	entity.Spec.Password = nil
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters) (interface{}, error) {
	if userObject, ok := entity.(*v1.User); ok {
		return s.update(userObject, parameters)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting user format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) update(entity *v1.User, parameters shared.Parameters) (*v1.User, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in user '%s' and coming from the http request: '%s' doesn't match", entity.Metadata.Name, parameters.Name)
		return nil, fmt.Errorf("%w: metadata.name and the name in the http path request doesn't match", shared.BadRequestError)
	}
	// find the previous version of the project
	oldEntity, err := s.Get(parameters)
	if err != nil {
		return nil, err
	}
	oldObject := oldEntity.(*v1.User)
	// update the immutable field of the newEntity with the old one
	entity.Metadata.CreatedAt = oldObject.Metadata.CreatedAt
	// update the field UpdatedAt with the new time
	entity.Metadata.UpdatedAt = time.Now().UTC()
	// in case the user updated his password, then we should hash it again, otherwise the old password should be kept
	if len(entity.Spec.Password) > 0 {
		hash, err := hashAndSalt(entity.Spec.Password)
		if err != nil {
			logrus.WithError(err).Errorf("unable to generate the hash for the password of the user %s", entity.Metadata.Name)
			return nil, shared.InternalError
		}
		entity.Spec.Password = hash
	} else {
		entity.Spec.Password = oldObject.Spec.Password
	}
	// in case the user is updating the firstname / lastname, then it should be updated, otherwise the old one should be kept
	if len(entity.Spec.FirstName) == 0 {
		entity.Spec.FirstName = oldObject.Spec.FirstName
	}
	if len(entity.Spec.LastName) == 0 {
		entity.Spec.LastName = oldObject.Spec.LastName
	}
	if err := s.dao.Update(entity); err != nil {
		logrus.WithError(err).Errorf("unable to perform the update of the project '%s', something wrong with etcd", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	// once the user is stored, remove the password so it won't be leaked
	entity.Spec.Password = nil
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters) error {
	if err := s.dao.Delete(parameters.Name); err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the user '%s'", parameters.Name)
			return shared.NotFoundError
		}
		logrus.WithError(err).Errorf("unable to delete the user '%s', something wrong with etcd", parameters.Name)
		return shared.InternalError
	}
	return nil
}

func (s *service) Get(parameters shared.Parameters) (interface{}, error) {
	entity, err := s.dao.Get(parameters.Name)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the user '%s'", parameters.Name)
			return nil, shared.NotFoundError
		}
		logrus.WithError(err).Errorf("unable to find the previous version of the user '%s', something wrong with etcd", parameters.Name)
		return nil, shared.InternalError
	}
	// remove the password so it won't be leaked
	entity.Spec.Password = nil
	return entity, nil
}

func (s *service) List(q etcd.Query, _ shared.Parameters) (interface{}, error) {
	// on each user found, let's remove the password so it won't be leaked
	results, err := s.dao.List(q)
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(results); i++ {
		results[i].Spec.Password = nil
	}
	return results, nil
}
