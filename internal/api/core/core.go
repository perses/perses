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

	"github.com/labstack/echo/v4"
	"github.com/perses/common/app"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/core/middleware"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/api/shared/migrate"
	"github.com/perses/perses/internal/api/shared/rbac"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/ui"
	"github.com/sirupsen/logrus"
)

func New(conf config.Config, banner string) (*app.Runner, dependency.PersistenceManager, error) {
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
	proxyMiddleware := &middleware.Proxy{
		Dashboard:    persistenceManager.GetDashboard(),
		Secret:       persistenceManager.GetSecret(),
		GlobalSecret: persistenceManager.GetGlobalSecret(),
		DTS:          persistenceManager.GetDatasource(),
		GlobalDTS:    persistenceManager.GetGlobalDatasource(),
		Crypto:       serviceManager.GetCrypto(),
	}
	runner := app.NewRunner().WithDefaultHTTPServer("perses").SetBanner(banner)

	// enable hot reload of CUE schemas for dashboard validation:
	// - watch for changes on the schemas folders
	// - register a cron task to reload all the schemas every <interval>
	watcher, reloader, err := schemas.NewHotReloaders(serviceManager.GetSchemas().GetLoaders())
	if err != nil {
		return nil, nil, fmt.Errorf("unable to instantiate the tasks for hot reload of schemas: %w", err)
	}
	// enable hot reload of the migration schemas
	migrateWatcher, migrateReloader, err := migrate.NewHotReloaders(serviceManager.GetMigration())
	if err != nil {
		return nil, nil, fmt.Errorf("unable to instantiate the tasks for hot reload of migration schema: %w", err)
	}
	runner.WithTasks(watcher, migrateWatcher)
	runner.WithCronTasks(conf.Schemas.Interval, reloader, migrateReloader)
	if len(conf.Provisioning.Folders) > 0 {
		runner.WithCronTasks(conf.Provisioning.Interval, serviceManager.GetProvisioning())
	}
	if conf.Security.EnableAuth {
		rbacTask := rbac.NewCronTask(serviceManager.GetRBAC())
		runner.WithCronTasks(conf.Security.Authorization.Interval, rbacTask)
	}

	// register the API
	runner.HTTPServerBuilder().
		APIRegistration(persesAPI).
		APIRegistration(persesFrontend).
		GzipSkipper(func(c echo.Context) bool {
			// let's skip the gzip compression when using the proxy and rely on the datasource behind.
			return strings.HasPrefix(c.Request().URL.Path, "/proxy")
		}).
		Middleware(proxyMiddleware.Proxy()).
		Middleware(middleware.HandleError()).
		Middleware(middleware.CheckProject(serviceManager.GetProject()))
	return runner, persistenceManager, nil
}
