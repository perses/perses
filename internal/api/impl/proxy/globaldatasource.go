// Copyright 2025 The Perses Authors
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

package proxy

import (
	"fmt"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

func (e *endpoint) proxyGlobalDatasource(ctx echo.Context, datasourceName string, spec v1.DatasourceSpec) error {
	path := ctx.Param("*")

	pr, err := newProxy(datasourceName, "", spec, path, e.crypto, func(name string) (*v1.SecretSpec, error) {
		return e.getGlobalSecret(datasourceName, name)
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *endpoint) proxyUnsavedGlobalDatasource(ctx echo.Context) error {
	body := &unsavedProxyBody{}
	if err := ctx.Bind(body); err != nil {
		return err
	}

	if err := e.checkPermission(ctx, v1.WildcardProject, role.GlobalDatasourceScope, role.CreateAction); err != nil {
		return err
	}

	body.setRequestParams(ctx)

	dtsName := unsavedDatasourceDefaultName
	if body.Spec.Display != nil {
		dtsName = body.Spec.Display.Name
	}

	return e.proxyGlobalDatasource(ctx, dtsName, body.Spec)
}

func (e *endpoint) proxySavedGlobalDatasource(ctx echo.Context) error {
	if err := e.checkPermission(ctx, v1.WildcardProject, role.GlobalDatasourceScope, role.ReadAction); err != nil {
		return err
	}

	dtsName := ctx.Param(utils.ParamName)
	dts, err := e.getGlobalDatasource(dtsName)
	if err != nil {
		return err
	}

	return e.proxyGlobalDatasource(ctx, dts.Metadata.Name, dts.Spec)
}

func (e *endpoint) getGlobalDatasource(name string) (*v1.GlobalDatasource, error) {
	dts, err := e.globalDTS.Get(name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return nil, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return nil, apiinterface.InternalError
	}
	return dts, nil
}

func (e *endpoint) getGlobalSecret(dtsName, name string) (*v1.SecretSpec, error) {
	scrt, err := e.globalSecret.Get(name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the GlobalSecret %q", name)
			return nil, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, secret %q attached doesn't exist", dtsName, name))
		}
		logrus.WithError(err).Errorf("unable to find the secret %q attached to the datasource %q, something wrong with the database", name, dtsName)
		return nil, apiinterface.InternalError
	}

	return &scrt.Spec, nil
}
