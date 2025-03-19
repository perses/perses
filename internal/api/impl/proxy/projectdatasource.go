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

func (e *endpoint) proxyProjectDatasource(ctx echo.Context, projectName, dtsName string, spec v1.DatasourceSpec) error {
	path := ctx.Param("*")
	pr, err := newProxy(spec, path, e.crypto, func(name string) (*v1.SecretSpec, error) {
		secret, err := e.getProjectSecret(projectName, dtsName, name)
		if err != nil {
			return e.getGlobalSecret(dtsName, name)
		}
		return secret, nil
	})
	if err != nil {
		return err
	}
	return pr.serve(ctx)
}

func (e *endpoint) proxyUnsavedProjectDatasource(ctx echo.Context) error {
	projectName := ctx.Param(utils.ParamProject)
	body := &unsavedProxyBody{}
	if err := ctx.Bind(body); err != nil {
		return err
	}

	if err := e.checkPermission(ctx, projectName, role.DatasourceScope, role.CreateAction); err != nil {
		return err
	}

	body.setRequestParams(ctx)

	dtsName := unsavedDatasourceDefaultName
	if body.Spec.Display != nil {
		dtsName = body.Spec.Display.Name
	}

	return e.proxyProjectDatasource(ctx, projectName, dtsName, body.Spec)
}

func (e *endpoint) proxySavedProjectDatasource(ctx echo.Context) error {
	projectName := ctx.Param(utils.ParamProject)
	if err := e.checkPermission(ctx, projectName, role.DatasourceScope, role.ReadAction); err != nil {
		return err
	}

	dtsName := ctx.Param(utils.ParamName)
	dts, err := e.getProjectDatasource(projectName, dtsName)
	if err != nil {
		return err
	}

	return e.proxyProjectDatasource(ctx, projectName, dtsName, dts)
}

func (e *endpoint) getProjectDatasource(projectName string, name string) (v1.DatasourceSpec, error) {
	dts, err := e.dts.Get(projectName, name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q in project %q", name, projectName)
			return v1.DatasourceSpec{}, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, datasource doesn't exist", name))
		}
		logrus.WithError(err).Errorf("unable to find the datasource %q, something wrong with the database", name)
		return v1.DatasourceSpec{}, apiinterface.InternalError
	}
	return dts.Spec, nil
}

func (e *endpoint) getProjectSecret(projectName string, dtsName string, name string) (*v1.SecretSpec, error) {
	scrt, err := e.secret.Get(projectName, name)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			logrus.Debugf("unable to find the Datasource %q", name)
			return nil, apiinterface.HandleNotFoundError(fmt.Sprintf("unable to forward the request to the datasource %q, secret %q attached doesn't exist", dtsName, name))
		}
		logrus.WithError(err).Errorf("unable to find the secret %q attached to the datasource %q, something wrong with the database", name, dtsName)
		return nil, apiinterface.InternalError
	}
	return &scrt.Spec, nil
}
