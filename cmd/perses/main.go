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

	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/impl/v1/view"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/sirupsen/logrus"
)

const banner = `
 ___________
\___________/
     ___________      ______
    \___________/     | ___ \
 ___________          | |_/ /__ _ __ ___  ___  ___
\___________/         |  __/ _ \ '__/ __|/ _ \/ __|
 ___                  | | |  __/ |  \__ \  __/\__ \
\___/                 \_|  \___|_|  |___/\___||___/  %s
__________________________________________________________

`

func registerMetrics(register prometheus.Registerer) {
	register.MustRegister(collectors.NewGoCollector())
	register.MustRegister(collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))
	view.RegisterMetrics(register)
	schemas.RegisterMetrics(register)
}

func main() {
	configFile := flag.String("config", "", "Path to the YAML configuration file for the API. Configuration settings can be overridden when using environment variables.")
	pprof := flag.Bool("pprof", false, "Enable pprof")
	flag.Parse()
	// load the config from file or/and from environment
	conf, err := config.Resolve(*configFile)
	if err != nil {
		logrus.WithError(err).Fatalf("error reading configuration from file %q or from environment", *configFile)
	}

	// metrics setup
	promRegistry := prometheus.NewRegistry()
	registerMetrics(promRegistry)

	runner, persistentManager, err := core.New(conf, *pprof, promRegistry, banner)
	if err != nil {
		logrus.Fatal(err)
	}
	defer func() {
		if daoCloseErr := persistentManager.GetPersesDAO().Close(); daoCloseErr != nil {
			logrus.WithError(daoCloseErr).Error("unable to close the connection to the database")
		}
	}()

	// start the application
	runner.Start()
}
