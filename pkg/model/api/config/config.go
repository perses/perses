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

package config

import (
	"github.com/perses/common/config"
)

type dashboardSelector struct {
	// Project is the name of the project (dashboard.metadata.project)
	Project string `json:"project" yaml:"project"`
	// Dashboard is the name of the dashboard (dashboard.metadata.name)
	Dashboard string `json:"dashboard" yaml:"dashboard"`
}
type Config struct {
	// Security contains any configuration that changes the API behavior like the endpoints exposed or if the permissions are activated.
	Security Security `json:"security,omitempty" yaml:"security,omitempty"`
	// Database contains the different configuration depending on the database you want to use
	Database Database `json:"database,omitempty" yaml:"database,omitempty"`
	// Schemas contain the configuration to get access to the CUE schemas
	Schemas Schemas `json:"schemas,omitempty" yaml:"schemas,omitempty"`
	// ImportantDashboards contains important dashboard selectors
	ImportantDashboards []dashboardSelector `json:"important_dashboards,omitempty" yaml:"important_dashboards,omitempty"`
	// Information contains markdown content to be display on the home page
	Information  string             `json:"information,omitempty" yaml:"information,omitempty"`
	Provisioning ProvisioningConfig `json:"provisioning,omitempty" yaml:"provisioning,omitempty"`
}

func (c *Config) Verify() error {
	return nil
}

func Resolve(configFile string) (Config, error) {
	c := Config{}
	return c, config.NewResolver[Config]().
		SetConfigFile(configFile).
		SetEnvPrefix("PERSES").
		Resolve(&c).
		Verify()
}
