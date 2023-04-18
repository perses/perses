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
	// Project correspond to the name of the project (dashboard.metadata.project)
	Project string `json:"project" yaml:"project"`
	// Dashboard correspond to the name of the dashboard (dashboard.metadata.name)
	Dashboard string `json:"dashboard" yaml:"dashboard"`
}

type Config struct {
	// Readonly will deactivate any HTTP POST, PUT, DELETE endpoint
	Readonly bool `json:"readonly" yaml:"readonly"`
	// Database contains the different configuration depending on the database you want to use
	Database Database `json:"database" yaml:"database"`
	// Schemas contains the configuration to get access to the CUE schemas
	Schemas Schemas `json:"schemas" yaml:"schemas"`
	// DashboardLists is a map of dashboard lists that can be used
	DashboardLists map[string][]dashboardSelector `json:"dashboard_lists,omitempty" yaml:"dashboard_lists,omitempty"`
	// Information contains markdown content to be display on the home page
	Information string `json:"information,omitempty" yaml:"information,omitempty"`
}

func Resolve(configFile string) (Config, error) {
	c := Config{}
	return c, config.NewResolver[Config]().
		SetConfigFile(configFile).
		SetEnvPrefix("PERSES").
		Resolve(&c).
		Verify()
}
