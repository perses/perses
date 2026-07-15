// Copyright The Perses Authors
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

package globaldatasource

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/brunoga/deep"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/validate"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceV1 "github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/perses/perses/pkg/model/api/v1/role"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/sirupsen/logrus"
)

type service struct {
	globaldatasource.Service
	dao   globaldatasource.DAO
	sch   schema.Schema
	authz authorization.Authorization
}

func NewService(dao globaldatasource.DAO, sch schema.Schema, authz authorization.Authorization) globaldatasource.Service {
	return &service{
		dao:   dao,
		sch:   sch,
		authz: authz,
	}
}

func (s *service) Create(ctx echo.Context, entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	if errPerm := s.checkSecretPermission(ctx, copyEntity); errPerm != nil {
		return nil, errPerm
	}
	return s.create(copyEntity)
}

func (s *service) create(entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	if err := s.validate(entity); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
	}
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(ctx echo.Context, entity *v1.GlobalDatasource, parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	if errPerm := s.checkSecretPermission(ctx, copyEntity); errPerm != nil {
		return nil, errPerm
	}
	return s.update(copyEntity, parameters)
}

func (s *service) update(entity *v1.GlobalDatasource, parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	if err := s.validate(entity); err != nil {
		return nil, apiInterface.HandleBadRequestError(err.Error())
	}
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in Datasource %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	// find the previous version of the Datasource
	oldEntity, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the GlobalDatasource %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(_ echo.Context, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(q *globaldatasource.Query) ([]*v1.GlobalDatasource, error) {
	dtsList, err := s.dao.List(q)
	if err != nil {
		return nil, err
	}
	return v1.FilterDatasource(q.Kind, q.Default, dtsList), nil
}

// checkSecretPermission ensures that the user that creates/updates a datasource with a secret actually has the secret
// reader permission.
func (s *service) checkSecretPermission(ctx echo.Context, datasource *v1.GlobalDatasource) error {
	if !s.authz.IsEnabled() {
		return nil
	}

	proxySpec, proxyKind, proxyErr := datasourceV1.ValidateAndExtract(datasource.Spec.Plugin.Spec)
	if proxyErr != nil {
		logrus.WithError(proxyErr).WithFields(map[string]interface{}{
			"datasource": datasource.Metadata.Name,
		}).Error("unable to build or find the config in the datasource spec")
		return echo.NewHTTPError(http.StatusBadGateway, "unable to build or find the config")
	}

	hasSecret := false
	switch proxyKind {
	case datasourceHTTP.ProxyKindName:
		httpConfig := proxySpec.(*datasourceHTTP.Config)
		if len(httpConfig.Secret) > 0 {
			hasSecret = true
		}
	case datasourceSQL.ProxyKindName:
		sqlConfig := proxySpec.(*datasourceSQL.Config)
		if len(sqlConfig.Secret) > 0 {
			hasSecret = true
		}
	}

	if !hasSecret {
		return nil
	}
	if ok := s.authz.HasPermission(ctx, role.ReadAction, v1.WildcardProject, role.GlobalSecretScope); !ok {
		return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission for '%s' kind", role.ReadAction, role.GlobalSecretScope))
	}

	return nil
}

func (s *service) MetadataList(_ *globaldatasource.Query) ([]api.Entity, error) {
	return nil, fmt.Errorf("not implemented")
}

func (s *service) RawList(_ *globaldatasource.Query) ([]json.RawMessage, error) {
	return nil, fmt.Errorf("not implemented")
}

func (s *service) RawMetadataList(_ *globaldatasource.Query) ([]json.RawMessage, error) {
	return nil, fmt.Errorf("not implemented")
}

func (s *service) validate(entity *v1.GlobalDatasource) error {
	var list []*v1.GlobalDatasource
	if entity.Spec.Default {
		var err error
		list, err = s.dao.List(&globaldatasource.Query{})
		if err != nil {
			logrus.WithError(err).Errorf("unable to get the list of the global datasource")
			return err
		}
	}
	return validate.Datasource(entity, list, s.sch)
}
