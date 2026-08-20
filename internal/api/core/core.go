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

package core

import (
	"fmt"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/perses/common/app"
	"github.com/perses/perses/internal/api/core/middleware"
	"github.com/perses/perses/internal/api/dashboard"
	"github.com/perses/perses/internal/api/dependency"
	"github.com/perses/perses/internal/api/discovery"
	"github.com/perses/perses/internal/api/provisioning"
	"github.com/perses/perses/internal/api/refresh"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/ui"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/sirupsen/logrus"
)

func New(conf config.Config, enablePprof bool, registry *prometheus.Registry, banner string) (*app.Runner, dependency.Manager, error) {
	dependencyManager, err := dependency.NewManager(conf)
	if err != nil {
		return nil, nil, fmt.Errorf("unable to instantiate the dependency manager: %w", err)
	}
	persesDAO := dependencyManager.Persistence().GetPersesDAO()
	if dbInitError := persesDAO.Init(); dbInitError != nil {
		return nil, nil, fmt.Errorf("unable to initialize the database: %w", dbInitError)
	}
	persesAPI := NewPersesAPI(dependencyManager, conf)
	persesFrontend := ui.NewPersesFrontend(conf, dependencyManager.Service().GetPlugin())
	runner := app.NewRunner().WithDefaultHTTPServerAndPrometheusRegisterer(utils.MetricNamespace, registry, registry).SetBanner(banner)

	// enable cleanup of the ephemeral dashboards once their ttl is reached
	if conf.EphemeralDashboard.Enable {
		ephemeralDashboardsCleaner, err := dashboard.NewEphemeralDashboardCleaner(dependencyManager.Persistence().GetEphemeralDashboard())
		if err != nil {
			return nil, nil, fmt.Errorf("unable to instantiate the task for cleaning ephemeral dashboards: %w", err)
		}
		runner.WithTimerTasks(time.Duration(conf.EphemeralDashboard.CleanupInterval), ephemeralDashboardsCleaner)
	}

	// Enable the provisioning of the resources from the folders defined in the configuration file.
	if len(conf.Provisioning.Folders) > 0 {
		provisioningTask, provisioningWatcher := provisioning.New(dependencyManager.Service(), conf.Provisioning.Folders, persesDAO.IsCaseSensitive())
		runner.WithTimerTasks(time.Duration(conf.Provisioning.Interval), provisioningTask)
		if conf.Provisioning.EnableWatch {
			runner.WithTasks(provisioningWatcher)
		}
	}

	// Enable the discovery of the datasources.
	if len(conf.Datasource.Global.Discovery) > 0 {
		datasourceDiscoveryTasks, sdErr := discovery.New(conf, dependencyManager.Service(), persesDAO.IsCaseSensitive())
		if sdErr != nil {
			return nil, nil, fmt.Errorf("unable to instantiate the tasks for datasource discovery: %w", sdErr)
		}
		runner.WithTaskHelpers(datasourceDiscoveryTasks...)
	}

	// Enable the refresh of the RBAC permissions if the native provider is enabled.
	if conf.Security.Authorization.Provider.Native.Enable {
		rbacTask := refresh.New(persesDAO,
			dependencyManager.Service().GetAuthorization().RefreshPermissions,
			[]modelV1.Kind{modelV1.KindRole, modelV1.KindRoleBinding, modelV1.KindGlobalRole, modelV1.KindGlobalRoleBinding},
		)
		runner.WithTimerTasks(time.Duration(conf.Security.Authorization.Provider.Native.CheckLatestUpdateInterval), rbacTask)
	}

	// Enable the refresh of the search index.
	runner.WithTimerTasks(time.Duration(conf.Search.CheckLatestUpdateInterval), refresh.New(persesDAO, dependencyManager.Service().GetIndex().Refresh, []modelV1.Kind{modelV1.KindDashboard}))

	// Extract the plugin archives and load the plugins.
	// Loading plugin is not mandatory, so we don't return an error if the plugin can't be loaded.
	unzipErr := dependencyManager.Service().GetPlugin().UnzipArchives()
	if unzipErr != nil {
		logrus.WithError(unzipErr).Error("unable to unzip the plugin archives")
	} else {
		if pluginErr := dependencyManager.Service().GetPlugin().Load(); pluginErr != nil {
			logrus.WithError(pluginErr).Error("unable to load the plugins")
		}
	}

	// register the API
	runner.
		WithDefaultLogrusBuilder().
		HTTPServerBuilder().
		ActivatePprof(enablePprof).
		APIRegistration(persesAPI).
		GzipSkipper(func(c echo.Context) bool {
			// let's skip the gzip compression when using the proxy and rely on the datasource behind.
			return strings.HasPrefix(c.Request().URL.Path, fmt.Sprintf("%s/proxy", conf.APIPrefix)) ||
				// When serving the plugins from a dev server, we don't want to compress the response since it's already compressed by rsbuild.
				(conf.Plugin.EnableDev && strings.HasPrefix(c.Request().URL.Path, fmt.Sprintf("%s/plugins", conf.APIPrefix)))
		}).
		Middleware(middleware.HandleError()).
		Middleware(middleware.CheckProject(dependencyManager.Service().GetProject()))
	if !conf.Frontend.Disable {
		runner.HTTPServerBuilder().APIRegistration(persesFrontend)
	}
	if len(conf.APIPrefix) > 0 {
		runner.HTTPServerBuilder().PreMiddleware(middleware.HandleAPIPrefix(conf.APIPrefix))
	}
	if conf.Security.CORS.Enable {
		runner.HTTPServerBuilder().Middleware(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
			AllowOrigins:     conf.Security.CORS.AllowOrigins,
			AllowMethods:     conf.Security.CORS.AllowMethods,
			AllowHeaders:     conf.Security.CORS.AllowHeaders,
			AllowCredentials: conf.Security.CORS.AllowCredentials,
			ExposeHeaders:    conf.Security.CORS.ExposeHeaders,
			MaxAge:           conf.Security.CORS.MaxAge,
		}))
	}
	return runner, dependencyManager, nil
}
