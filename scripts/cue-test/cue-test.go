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

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"

	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/internal/api/shared/validate"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

type validateFunc func(plugin common.Plugin, name string) error

func validateSchemas(folder string, vf validateFunc) {
	logrus.Infof("validate schemas under %q", folder)
	dirEntries, err := os.ReadDir(folder)
	if err != nil {
		logrus.Fatal(err)
	}
	for _, dir := range dirEntries {
		data, readErr := os.ReadFile(filepath.Join(folder, dir.Name(), fmt.Sprintf("%s.json", dir.Name())))
		if readErr != nil {
			logrus.Fatal(readErr)
		}
		plugin := &common.Plugin{}
		if jsonErr := json.Unmarshal(data, plugin); jsonErr != nil {
			logrus.Fatal(jsonErr)
		}
		if validateErr := vf(*plugin, dir.Name()); validateErr != nil {
			logrus.Fatal(validateErr)
		}
	}
}

func validateAllSchemas(sch schemas.Schemas) {
	validateSchemas(config.DefaultPanelsPath, func(plugin common.Plugin, name string) error {
		return sch.ValidatePanel(plugin, name)
	})
	validateSchemas(config.DefaultDatasourcesPath, func(plugin common.Plugin, _ string) error {
		return sch.ValidateDatasource(plugin)
	})
	validateSchemas(config.DefaultVariablesPath, func(plugin common.Plugin, name string) error {
		return sch.ValidateVariable(plugin, name)
	})
}

func validateAllDashboards(sch schemas.Schemas) {
	logrus.Info("validate all dashboard in dev/data")
	data, err := os.ReadFile(path.Join("dev", "data", "dashboard.json"))
	if err != nil {
		logrus.Fatal(err)
	}
	var dashboardList []*v1.Dashboard
	if jsonErr := json.Unmarshal(data, &dashboardList); jsonErr != nil {
		logrus.Fatal(jsonErr)
	}
	for _, dashboard := range dashboardList {
		if vErr := validate.Dashboard(dashboard, sch); vErr != nil {
			logrus.Fatal(vErr)
		}
	}
}

func validateAllDatasources(sch schemas.Schemas) {
	logrus.Info("validate all datasources in dev/data")
	data, err := os.ReadFile(path.Join("dev", "data", "localdatasource.json"))
	if err != nil {
		logrus.Fatal(err)
	}
	var datasourceList []*v1.Datasource
	if jsonErr := json.Unmarshal(data, &datasourceList); jsonErr != nil {
		logrus.Fatal(jsonErr)
	}
	for _, datasource := range datasourceList {
		if vErr := validate.Datasource(datasource, nil, sch); vErr != nil {
			logrus.Fatal(vErr)
		}
	}
}

func validateAllGlobalDatasources(sch schemas.Schemas) {
	logrus.Info("validate all globalDatasources in dev/data")
	data, err := os.ReadFile(path.Join("dev", "data", "globaldatasource.json"))
	if err != nil {
		logrus.Fatal(err)
	}
	var datasourceList []*v1.GlobalDatasource
	if jsonErr := json.Unmarshal(data, &datasourceList); jsonErr != nil {
		logrus.Fatal(jsonErr)
	}
	for _, datasource := range datasourceList {
		if vErr := validate.Datasource(datasource, nil, sch); vErr != nil {
			logrus.Fatal(vErr)
		}
	}
}

func main() {
	cfg := config.Schemas{}
	_ = cfg.Verify()
	sch, err := schemas.New(cfg)
	if err != nil {
		logrus.Fatal(err)
	}
	validateAllSchemas(sch)
	validateAllDashboards(sch)
	validateAllDatasources(sch)
	validateAllGlobalDatasources(sch)
}
