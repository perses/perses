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

package datasource

import (
	"encoding/json"
	"fmt"
	"reflect"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/sirupsen/logrus"
)

func doesKindProxyExist(v reflect.Value) bool {
	for i := 0; i < v.NumField(); i++ {
		if v.Type().Field(i).Name == "Kind" && v.Field(i).Type().Name() == "string" && v.Field(i).String() == "HTTP" {
			return true
		}
	}
	return false
}

func getHTTPProxySpec(v reflect.Value) reflect.Value {
	for i := 0; i < v.NumField(); i++ {
		if v.Type().Field(i).Name == "Spec" {
			return v.Field(i)
		}
	}
	return reflect.Value{}
}

func lookingForHttpProxy(v reflect.Value, httpConfig *http.Config, err error, found *bool) {
	if len(v.Type().PkgPath()) > 0 {
		// the field is not exported, so no need to look at it as we won't be able to set it in a later stage
		return
	}
	if v.Kind() == reflect.Ptr {
		if !v.IsNil() {
			v = v.Elem()
		}
	}

	if v.Kind() == reflect.Struct {
		if *found = doesKindProxyExist(v); *found {
			// then get the spec field
			spec := getHTTPProxySpec(v)
			if spec == (reflect.Value{}) {
				return
			}
			// Then unmarshal the proxy to validate the content
			var data []byte
			data, err = json.Marshal(v.Interface())
			if err != nil {
				return
			}
			err = json.Unmarshal(data, httpConfig)
		} else {
			// Otherwise look deeper to find it
			for i := 0; i < v.NumField(); i++ {
				lookingForHttpProxy(v.Field(i), httpConfig, err, found)
				if *found || err != nil {
					return
				}
			}
		}
	}
}

func checkAndValidateHTTPProxy(plugin v1.DatasourcePlugin) (*http.Config, error) {
	httpConfig := &http.Config{}
	var err error
	var found *bool
	*found = false
	lookingForHttpProxy(reflect.ValueOf(plugin.Spec), httpConfig, err, found)
	return httpConfig, err
}

type service struct {
	datasource.Service
	dao datasource.DAO
}

func NewService(dao datasource.DAO) datasource.Service {
	return &service{
		dao: dao,
	}
}

func (s *service) Create(entity api.Entity) (interface{}, error) {
	if datasourceObject, ok := entity.(*v1.Datasource); ok {
		return s.create(datasourceObject)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting Datasource format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) create(entity *v1.Datasource) (*v1.Datasource, error) {
	// In case there is a proxy defined, check if it is properly defined
	_, err := checkAndValidateHTTPProxy(entity.Spec.Plugin)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", shared.BadRequestError, err)
	}
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		if etcd.IsKeyConflict(err) {
			logrus.Debugf("unable to create the Datasource %q. It already exits", entity.Metadata.Name)
			return nil, shared.ConflictError
		}
		logrus.WithError(err).Errorf("unable to perform the creation of the Datasource %q, something wrong with etcd", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters) (interface{}, error) {
	if DatasourceObject, ok := entity.(*v1.Datasource); ok {
		return s.update(DatasourceObject, parameters)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting Datasource format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) update(entity *v1.Datasource, parameters shared.Parameters) (*v1.Datasource, error) {
	// In case there is a proxy defined, check if it is properly defined
	_, err := checkAndValidateHTTPProxy(entity.Spec.Plugin)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", shared.BadRequestError, err)
	}
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and coming from the http request: %q doesn't match", entity.Metadata.Name, parameters.Name)
		return nil, fmt.Errorf("%w: metadata.name and the name in the http path request doesn't match", shared.BadRequestError)
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in datasource %q and coming from the http request: %q doesn't match", entity.Metadata.Project, parameters.Project)
		return nil, fmt.Errorf("%w: metadata.project and the project name in the http path request doesn't match", shared.BadRequestError)
	}
	// find the previous version of the Datasource
	oldEntity, err := s.Get(parameters)
	if err != nil {
		return nil, err
	}
	oldObject := oldEntity.(*v1.Datasource)
	entity.Metadata.Update(oldObject.Metadata)
	if err := s.dao.Update(entity); err != nil {
		logrus.WithError(err).Errorf("unable to perform the update of the Datasource %q, something wrong with etcd", entity.Metadata.Name)
		return nil, shared.InternalError
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters) error {
	if err := s.dao.Delete(parameters.Project, parameters.Name); err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", parameters.Name)
			return shared.NotFoundError
		}
		logrus.WithError(err).Errorf("unable to delete the Datasource %q, something wrong with etcd", parameters.Name)
		return shared.InternalError
	}
	return nil
}

func (s *service) Get(parameters shared.Parameters) (interface{}, error) {
	entity, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		if etcd.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", parameters.Name)
			return nil, shared.NotFoundError
		}
		logrus.WithError(err).Errorf("unable to find the previous version of the Datasource %q, something wrong with etcd", parameters.Name)
		return nil, shared.InternalError
	}
	return entity, nil
}

func (s *service) List(q etcd.Query, _ shared.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
