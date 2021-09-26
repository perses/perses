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

package main

import (
	"flag"

	"github.com/perses/common/app"
	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/core/middleware"
	"github.com/perses/perses/internal/api/front"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/config"
	"github.com/sirupsen/logrus"
)

const banner = `
______                       
| ___ \                      
| |_/ /__ _ __ ___  ___  ___ 
|  __/ _ \ '__/ __|/ _ \/ __|
| | |  __/ |  \__ \  __/\__ \
\_|  \___|_|  |___/\___||___/  %s 

All your monitoring dashboards in one place.               <\
                                                            \\
--------------==========================================>|||<*>//////]
                                                            //
                                                           </
`

func main() {
	configFile := flag.String("config", "", "Path to the YAML configuration file for the API. Configuration settings can be overridden when using environment variables.")
	dbFolder := flag.String("db.folder", "", "Path to the folder to use as a database. In case the flag is not used, Perses requires a connection to etcd.")
	dbExtension := flag.String("db.extension", "yaml", "The extension of the file to read and use when creating a file. Valid values: 'yaml' or 'json'.")
	flag.Parse()
	// load the config from file or/and from environment
	conf, err := config.Resolve(*configFile, *dbFolder, *dbExtension)
	if err != nil {
		logrus.WithError(err).Fatalf("error reading configuration from file %q or from environment", *configFile)
	}
	persistenceManager, err := dependency.NewPersistenceManager(conf.Database)
	if err != nil {
		logrus.WithError(err).Fatal("unable to instantiate the persistence manager")
	}
	serviceManager := dependency.NewServiceManager(persistenceManager)
	persesAPI := core.NewPersesAPI(serviceManager)
	persesFrontend := front.NewPersesFrontend()
	runner := app.NewRunner().WithDefaultHTTPServer("perses").SetBanner(banner)
	// register the API
	runner.HTTPServerBuilder().
		APIRegistration(persesAPI).
		APIRegistration(persesFrontend).
		Middleware(middleware.Proxy(persistenceManager.GetDatasource(), persistenceManager.GetGlobalDatasource()))
	// start the application
	runner.Start()
}
