package main

import (
	"flag"

	"github.com/perses/common/app"
	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/config"
	"github.com/sirupsen/logrus"
)

func main() {
	configFile := flag.String("config", "", "Path to the yaml configuration file for the api. Configuration can be overridden when using the environment variable")
	flag.Parse()
	// load the config from file or/and from environment
	conf, err := config.Resolve(*configFile)
	if err != nil {
		logrus.WithError(err).Fatalf("error when reading configuration or from file '%s' or from environment", *configFile)
	}
	persistenceManager, err := dependency.NewPersistenceManager(conf.Etcd)
	if err != nil {
		logrus.WithError(err).Fatal("unable to instantiate the persistent manager")
	}
	serviceManager := dependency.NewServiceManager(persistenceManager)
	persesAPI := core.NewPersesAPI(serviceManager)
	runner := app.NewRunner().WithDefaultHTTPServer("perses")
	// register the API
	runner.HTTPServerBuilder().APIRegistration(persesAPI)
	// start the application
	runner.Start()
}
