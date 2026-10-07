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

package proxy

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/impl/proxy/common"
	httpProxy "github.com/perses/perses/internal/api/impl/proxy/http"
	"github.com/perses/perses/internal/api/impl/proxy/sql"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/secretfile"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourcev1 "github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/perses/perses/pkg/model/api/v1/role"
	datasourceSpec "github.com/perses/spec/go/datasource"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/sirupsen/logrus"
)

var _ = json.Unmarshaler(&unsavedProxyBody{})

// unsavedProxyBody is the body of the request when the datasource is not saved yet.
// It contains the body of the request and the datasource spec, which is used to build the proxy rather than
// retrieving the datasource from the database.
type unsavedProxyBody struct {
	Method string              `json:"method" yaml:"method"`
	Body   []byte              `json:"body,omitempty" yaml:"body"`
	Spec   datasourceSpec.Spec `json:"spec" yaml:"spec"`
}

func (u *unsavedProxyBody) UnmarshalJSON(data []byte) error {
	type Alias unsavedProxyBody
	aux := Alias{}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if aux.Method == "" {
		return fmt.Errorf("missing field 'method'")
	}

	if aux.Method != http.MethodGet && aux.Method != http.MethodPost && aux.Method != http.MethodPut && aux.Method != http.MethodDelete {
		return fmt.Errorf("invalid method %q", aux.Method)
	}

	if _, _, err := datasourcev1.ValidateAndExtract(aux.Spec.Plugin.Spec); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	*u = unsavedProxyBody(aux)
	return nil
}

func (u *unsavedProxyBody) setRequestParams(ctx echo.Context) {
	req := ctx.Request()
	req.Method = u.Method

	if len(u.Body) > 0 {
		req.Body = io.NopCloser(strings.NewReader(string(u.Body)))
	} else {
		req.Body = nil
	}

	req.ContentLength = int64(len(u.Body))

	ctx.SetRequest(req)
}

const unsavedDatasourceDefaultName = "unsaved-datasource"

type endpoint struct {
	cfg            config.DatasourceConfig
	dashboard      dashboard.DAO
	secret         secret.DAO
	globalSecret   globalsecret.DAO
	dts            datasource.DAO
	globalDTS      globaldatasource.DAO
	crypto         crypto.Crypto
	fileValidator  *secretfile.Validator
	guard          *netguard.Guard
	authz          authorization.Authorization
	tokenRefresher crypto.TokenRefresher
	transports     *httpProxy.TransportCache
}

func New(cfg config.DatasourceConfig, dashboardDAO dashboard.DAO, secretDAO secret.DAO, globalSecretDAO globalsecret.DAO,
	dtsDAO datasource.DAO, globalDtsDAO globaldatasource.DAO, crypto crypto.Crypto, fileValidator *secretfile.Validator,
	guard *netguard.Guard, authz authorization.Authorization, tokenRefresher crypto.TokenRefresher) route.Endpoint {
	if !authz.IsEnabled() {
		logrus.Warning("'security.enable_auth' is false: anyone able to reach Perses can create a datasource and use the datasource proxy, " +
			"including the unsaved proxy endpoints ('/proxy/unsaved/...') that accept any datasource spec in the request body without saving it. " +
			"The destinations of the proxy are then only restricted by the 'datasource.proxy' configuration")
	}
	return &endpoint{
		cfg:            cfg,
		dashboard:      dashboardDAO,
		secret:         secretDAO,
		globalSecret:   globalSecretDAO,
		dts:            dtsDAO,
		globalDTS:      globalDtsDAO,
		crypto:         crypto,
		fileValidator:  fileValidator,
		guard:          guard,
		authz:          authz,
		tokenRefresher: tokenRefresher,
		transports:     httpProxy.NewTransportCache(),
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	if !e.cfg.Global.Disable {
		g.ANY(fmt.Sprintf("/%s/:%s/*", utils.PathGlobalDatasource, utils.ParamName), e.proxySavedGlobalDatasource, false)
		// allow direct datasource queries without extra path (e.g., from ClickHouse)
		g.ANY(fmt.Sprintf("/%s/:%s", utils.PathGlobalDatasource, utils.ParamName), e.proxySavedGlobalDatasource, false)

		g.POST(fmt.Sprintf("/%s/%s/*", utils.PathUnsaved, utils.PathGlobalDatasource), e.proxyUnsavedGlobalDatasource, false)
	}
	if !e.cfg.Project.Disable {
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDatasource, utils.ParamName), e.proxySavedProjectDatasource, false)
		// allow direct datasource queries without extra path (e.g., from ClickHouse)
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s", utils.PathProject, utils.ParamProject, utils.PathDatasource, utils.ParamName), e.proxySavedProjectDatasource, false)

		g.POST(fmt.Sprintf("/%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDatasource), e.proxyUnsavedProjectDatasource, false)
	}
	if !e.cfg.DisableLocal {
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/%s/:%s/*", utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource, utils.ParamName), e.proxySavedDashboardDatasource, false)
		// allow direct datasource queries without extra path (e.g., from ClickHouse)
		g.ANY(fmt.Sprintf("/%s/:%s/%s/:%s/%s/:%s", utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource, utils.ParamName), e.proxySavedDashboardDatasource, false)

		g.POST(fmt.Sprintf("/%s/%s/:%s/%s/:%s/%s/*", utils.PathUnsaved, utils.PathProject, utils.ParamProject, utils.PathDashboard, utils.ParamDashboard, utils.PathDatasource), e.proxyUnsavedDashboardDatasource, false)
	}
}

func (e *endpoint) checkPermission(ctx echo.Context, projectName string, scope role.Scope, action role.Action) error {
	if !e.authz.IsEnabled() {
		return nil
	}

	if role.IsGlobalScope(scope) {
		if ok := e.authz.HasPermission(ctx, action, v1.WildcardProject, scope); !ok {
			return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, scope))
		}
		return nil
	}

	if ok := e.authz.HasPermission(ctx, action, projectName, scope); !ok {
		return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, scope))
	}

	return nil
}

// forwardCallerAuthorization returns true if the Authorization header sent by the caller can be forwarded to the datasource.
// When the native authorization is enabled, the Authorization header contains the Perses session token of the caller
// (directly set by the client or built from the session cookies). It must never reach the datasource,
// otherwise anyone controlling or observing the datasource would be able to impersonate the caller.
// When the authorization is delegated (i.e. Kubernetes), the header contains the token provided by the external
// authentication layer, and it is kept as is to not break deployments relying on it to query the datasource.
// When the authentication is disabled, the header is not a Perses credential and is kept as is.
func (e *endpoint) forwardCallerAuthorization() bool {
	if e.authz == nil {
		return false
	}
	return !e.authz.IsEnabled() || !e.authz.IsNativeAuthz()
}

type proxy interface {
	Serve(c echo.Context) error
}

// newProxy builds the proxy matching the kind of the datasource.
// transportKey identifies the saved datasource in the transport cache. It must be empty for unsaved datasources,
// so their (one-off) transport is not cached.
func (e *endpoint) newProxy(datasourceName, projectName, transportKey string, spec datasourceSpec.Spec, path string,
	retrieveSecret func(name string) (*v1.SecretSpec, error)) (proxy, error) {
	cfg, kind, err := datasourcev1.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		logrus.WithError(err).WithFields(map[string]interface{}{
			common.DatasourceFieldLog: datasourceName,
			common.ProjectFieldLog:    common.ProjectForLog(projectName),
		}).Error("unable to build or find the config in the datasource spec")
		return nil, echo.NewHTTPError(http.StatusBadGateway, "unable to build or find the config")
	}

	// The destination is verified before anything else, in particular before decrypting the secret.
	// It covers the saved datasources (that could have been stored before the policy was enforced or changed)
	// as well as the unsaved ones coming from the request body.
	if validateErr := e.guard.ValidateProxyConfig(cfg, kind); validateErr != nil {
		entry := logrus.WithError(validateErr).WithFields(map[string]interface{}{
			common.DatasourceFieldLog: datasourceName,
			common.ProjectFieldLog:    common.ProjectForLog(projectName),
		})
		const msg = "the datasource destination is not allowed"
		if len(transportKey) == 0 {
			// Unsaved datasource: the spec comes from the request body.
			// Logging at debug level avoids letting any user flood the logs.
			entry.Debug(msg)
		} else {
			entry.Warning(msg)
		}
		if netguard.IsDenied(validateErr) {
			return nil, apiinterface.HandleForbiddenError(validateErr.Error())
		}
		return nil, apiinterface.HandleBadRequestError(validateErr.Error())
	}

	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	loadSecret := func(name string) (*v1.SecretSpec, error) {
		scrt, retrieveErr := retrieveSecret(name)
		if retrieveErr != nil {
			return nil, retrieveErr
		}
		if _, decryptErr := e.crypto.Decrypt(scrt); decryptErr != nil {
			logrus.WithError(decryptErr).WithFields(map[string]interface{}{
				common.DatasourceFieldLog: datasourceName,
				common.ProjectFieldLog:    common.ProjectForLog(projectName),
			}).Error("unable to decrypt the datasource secret")
			return nil, apiinterface.InternalError
		}
		// Defense in depth: the secret might have been stored before the file restriction was enforced
		// (or the allowed directories changed since). Never read a file that is not explicitly allowed.
		if validateErr := e.fileValidator.ValidateSpec(scrt); validateErr != nil {
			logrus.WithError(validateErr).WithFields(map[string]interface{}{
				common.DatasourceFieldLog: datasourceName,
				common.ProjectFieldLog:    common.ProjectForLog(projectName),
			}).Warning("the datasource secret references a file that is not allowed")
			return nil, apiinterface.HandleForbiddenError(fmt.Sprintf("secret %q references a file that is not allowed", name))
		}
		return scrt, nil
	}

	var scrt *v1.SecretSpec

	switch kind {
	case datasourceHTTP.ProxyKindName:
		httpConfig := cfg.(*datasourceHTTP.Config)
		if len(httpConfig.Secret) > 0 {
			scrt, err = loadSecret(httpConfig.Secret)
			if err != nil {
				return nil, err
			}
		}
		return &httpProxy.Proxy{
			Config:                     httpConfig,
			DatasourceName:             datasourceName,
			Path:                       path,
			Secret:                     scrt,
			Guard:                      e.guard,
			TokenRefresher:             e.tokenRefresher,
			Transports:                 e.transports,
			TransportKey:               transportKey,
			ProxyConfig:                e.cfg.Proxy.HTTP,
			ForwardCallerAuthorization: e.forwardCallerAuthorization(),
		}, nil
	case datasourceSQL.ProxyKindName:
		sqlConfig := cfg.(*datasourceSQL.Config)
		if len(sqlConfig.Secret) > 0 {
			scrt, err = loadSecret(sqlConfig.Secret)
			if err != nil {
				return nil, err
			}
		}
		return &sql.Proxy{
			Config:  sqlConfig,
			Name:    datasourceName,
			Project: projectName,
			Path:    path,
			Secret:  scrt,
			Guard:   e.guard,
		}, nil
	default:
		return nil, errors.New("no proxy kind found")
	}
}
