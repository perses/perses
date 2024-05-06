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
	"github.com/perses/common/app"
	"github.com/perses/perses/internal/api/core/middleware"
	"github.com/perses/perses/internal/api/dashboard"
	"github.com/perses/perses/internal/api/dependency"
	"github.com/perses/perses/internal/api/migrate"
	"github.com/perses/perses/internal/api/provisioning"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/schemas"
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
	persesFrontend := ui.NewPersesFrontend()
	runner := app.NewRunner().WithDefaultHTTPServerAndPrometheusRegisterer(utils.MetricNamespace, registry, registry).SetBanner(banner)

	// enable hot reload of CUE schemas for dashboard validation:
	// - watch for changes on the schemas folders
	// - register a cron task to reload all the schemas every <interval>
	watcher, reloader, err := schemas.NewHotReloaders(serviceManager.GetSchemas().GetLoaders())
	if err != nil {
		return nil, nil, fmt.Errorf("unable to instantiate the tasks for hot reload of schemas: %w", err)
	}
	// enable hot reload of the migration schemas
	migrateWatcher, _, err := migrate.NewHotReloaders(serviceManager.GetMigration())
	if err != nil {
		return nil, nil, fmt.Errorf("unable to instantiate the tasks for hot reload of migration schema: %w", err)
	}
	// enable cleanup of the ephemeral dashboards once their ttl is reached
	ephemeralDashboardsCleaner, err := dashboard.NewEphemeralDashboardCleaner(persistenceManager.GetEphemeralDashboard())
	if err != nil {
		return nil, nil, fmt.Errorf("unable to instantiate the task for cleaning ephemeral dashboards: %w", err)
	}

	// There is a memory leak in the package Cuelang we are using: https://github.com/cue-lang/cue/issues/2121.
	// We need to clean up the Cuelang context periodically, because it kept in memory everything that has been validated.
	// So each time we are creating / updating a dashboard, memory is increased and never flushed.
	// The way to clean up the Cuelang context today is by reloading the schema.
	//
	// BUT each time we are reloading the schemas, memory is also increased because of the memory leak pointed in the above issue.
	//
	// The idea to mitigate this memory leak we cannot avoid is to reload the schema at the same rate as the provisioner or every 6h.
	// We hope that the data stored during the provisioner is higher than the one kept during the reload of the schema.
	// So if we reload the schema, then we will release more memory than the one kept by the reload of the schema.

	schemaReloadDuration := time.Hour * 6
	if len(conf.Provisioning.Folders) > 0 && time.Duration(conf.Provisioning.Interval) <= schemaReloadDuration {
		schemaReloadDuration = time.Duration(conf.Provisioning.Interval)
	}
	// We are not reloading the migration schema as it doesn't help to flush the context used for the validation.
	runner.WithTimerTasks(schemaReloadDuration, reloader)
	runner.WithTasks(watcher, migrateWatcher)

	if len(conf.Provisioning.Folders) > 0 {
		provisioningTask := provisioning.New(serviceManager, conf.Provisioning.Folders, persesDAO.IsCaseSensitive())
		runner.WithTimerTasks(time.Duration(conf.Provisioning.Interval), provisioningTask)
	}
	if conf.Security.EnableAuth {
		rbacTask := rbac.NewCronTask(serviceManager.GetRBAC(), persesDAO)
		runner.WithTimerTasks(time.Duration(conf.Security.Authorization.CheckLatestUpdateInterval), rbacTask)
	}
	runner.WithTimerTasks(time.Duration(conf.EphemeralDashboardsCleanupInterval), ephemeralDashboardsCleaner)

	// register the API
	runner.HTTPServerBuilder().
		ActivatePprof(enablePprof).
		APIRegistration(persesAPI).
		GzipSkipper(func(c echo.Context) bool {
			// let's skip the gzip compression when using the proxy and rely on the datasource behind.
			return strings.HasPrefix(c.Request().URL.Path, "/proxy")
		}).
		Middleware(middleware.HandleError()).
		Middleware(middleware.CheckProject(serviceManager.GetProject()))
	if !conf.Frontend.Deactivate {
		runner.HTTPServerBuilder().APIRegistration(persesFrontend)
	}
	return runner, persistenceManager, nil
}
