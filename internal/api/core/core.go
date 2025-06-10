// Copyright 2023 The Perses Authors
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
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/ui"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/sirupsen/logrus"
)

func New(conf config.Config, enablePprof bool, registry *prometheus.Registry, banner string) (*app.Runner, dependency.PersistenceManager, error) {
	persistenceManager, err := dependency.NewPersistenceManager(conf.Database)
	if err != nil {
		logrus.WithError(err).Fatal("unable to instantiate the persistence manager")
	}
	persesDAO := persistenceManager.GetPersesDAO()
	if dbInitError := persesDAO.Init(); dbInitError != nil {
		return nil, nil, fmt.Errorf("unable to initialize the database: %w", dbInitError)
	}
	serviceManager, err := dependency.NewServiceManager(persistenceManager, conf)
	if err != nil {
		return nil, nil, fmt.Errorf("unable to initialize the service manager: %w", err)
	}
	persesAPI := NewPersesAPI(serviceManager, persistenceManager, conf)
	persesFrontend := ui.NewPersesFrontend(conf, serviceManager.GetPlugin())
	runner := app.NewRunner().WithDefaultHTTPServerAndPrometheusRegisterer(utils.MetricNamespace, registry, registry).SetBanner(banner)

	// enable cleanup of the ephemeral dashboards once their ttl is reached
	if conf.EphemeralDashboard.Enable {
		ephemeralDashboardsCleaner, err := dashboard.NewEphemeralDashboardCleaner(persistenceManager.GetEphemeralDashboard())
		if err != nil {
			return nil, nil, fmt.Errorf("unable to instantiate the task for cleaning ephemeral dashboards: %w", err)
		}
		runner.WithTimerTasks(time.Duration(conf.EphemeralDashboard.CleanupInterval), ephemeralDashboardsCleaner)
	}

	if len(conf.Provisioning.Folders) > 0 {
		provisioningTask := provisioning.New(serviceManager, conf.Provisioning.Folders, persesDAO.IsCaseSensitive())
		runner.WithTimerTasks(time.Duration(conf.Provisioning.Interval), provisioningTask)
	}
	if len(conf.Datasource.Global.Discovery) > 0 {
		datasourceDiscoveryTasks, sdErr := discovery.New(conf, serviceManager, persesDAO.IsCaseSensitive())
		if sdErr != nil {
			return nil, nil, fmt.Errorf("unable to instantiate the tasks for datasource discovery: %w", sdErr)
		}
		runner.WithTaskHelpers(datasourceDiscoveryTasks...)
	}
	if conf.Security.EnableAuth {
		rbacTask := rbac.NewCronTask(serviceManager.GetRBAC(), persesDAO)
		runner.WithTimerTasks(time.Duration(conf.Security.Authorization.CheckLatestUpdateInterval), rbacTask)
	}

	// Extract the plugin archives and load the plugins.
	// Loading plugin is not mandatory, so we don't return an error if the plugin can't be loaded.
	unzipErr := serviceManager.GetPlugin().UnzipArchives()
	if unzipErr != nil {
		logrus.WithError(unzipErr).Error("unable to unzip the plugin archives")
	} else {
		if pluginErr := serviceManager.GetPlugin().Load(); pluginErr != nil {
			logrus.WithError(pluginErr).Error("unable to load the plugins")
		}
	}

	// register the API
	runner.HTTPServerBuilder().
		ActivatePprof(enablePprof).
		APIRegistration(persesAPI).
		GzipSkipper(func(c echo.Context) bool {
			// let's skip the gzip compression when using the proxy and rely on the datasource behind.
			return strings.HasPrefix(c.Request().URL.Path, fmt.Sprintf("%s/proxy", conf.APIPrefix)) ||
				// When serving the plugins from a dev server, we don't want to compress the response since it's already compressed by rsbuild.
				(conf.Plugin.EnableDev && strings.HasPrefix(c.Request().URL.Path, fmt.Sprintf("%s/plugins", conf.APIPrefix)))
		}).
		Middleware(middleware.HandleError()).
		Middleware(middleware.CheckProject(serviceManager.GetProject()))
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
	return runner, persistenceManager, nil
}
