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
	"strings"
	"time"

	"github.com/perses/common/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

const (
	defaultEphemeralDashboardsCleanupInterval = 24 * time.Hour
)

type EphemeralDashboard struct {
	// When true user will be able to use the ephemeral dashboard at project level.
	Enable bool `json:"enable" yaml:"enable"`
	// The interval at which to trigger the cleanup of ephemeral dashboards, based on their TTLs.
	CleanupInterval common.Duration `json:"cleanup_interval" yaml:"cleanup_interval"`
}

func (e *EphemeralDashboard) Verify() error {
	if e.Enable && e.CleanupInterval <= 0 {
		e.CleanupInterval = common.Duration(defaultEphemeralDashboardsCleanupInterval)
	}
	return nil
}

type dashboardSelector struct {
	// Project is the name of the project (dashboard.metadata.project)
	Project string `json:"project" yaml:"project"`
	// Dashboard is the name of the dashboard (dashboard.metadata.name)
	Dashboard string `json:"dashboard" yaml:"dashboard"`
}
type Config struct {
	// Use it in case you want to prefix the API path.
	APIPrefix string `json:"api_prefix,omitempty" yaml:"api_prefix,omitempty"`
	// Security contains any configuration that changes the API behavior like the endpoints exposed or if the permissions are activated.
	Security Security `json:"security,omitempty" yaml:"security,omitempty"`
	// Database contains the different configuration depending on the database you want to use
	Database Database `json:"database,omitempty" yaml:"database,omitempty"`
	// Schemas contain the configuration to get access to the CUE schemas
	// DEPRECATED.
	// Please remove it from your config.
	Schemas *Schemas `json:"schemas,omitempty" yaml:"schemas,omitempty"`
	// Dashboard contains the configuration for the dashboard feature.
	Dashboard DashboardConfig `json:"dashboard,omitempty" yaml:"dashboard,omitempty"`
	// Provisioning contains the provisioning config that can be used if you want to provide default resources.
	Provisioning ProvisioningConfig `json:"provisioning,omitempty" yaml:"provisioning,omitempty"`
	// Datasource contains the configuration for the datasource.
	Datasource DatasourceConfig `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	// Variable contains the configuration for the variable.
	Variable VariableConfig `json:"variable,omitempty" yaml:"variable,omitempty"`
	// EphemeralDashboardsCleanupInterval is the interval at which the ephemeral dashboards are cleaned up
	// DEPRECATED.
	// Please use the config EphemeralDashboard instead.
	EphemeralDashboardsCleanupInterval common.Duration `json:"ephemeral_dashboards_cleanup_interval,omitempty" yaml:"ephemeral_dashboards_cleanup_interval,omitempty"`
	// EphemeralDashboard contains the config about the ephemeral dashboard feature
	EphemeralDashboard EphemeralDashboard `json:"ephemeral_dashboard,omitempty" yaml:"ephemeral_dashboard,omitempty"`
	// Frontend contains any config that will be used by the frontend itself.
	Frontend Frontend `json:"frontend,omitempty" yaml:"frontend,omitempty"`
	// Plugin contains the config for runtime plugins.
	Plugin Plugin `json:"plugin,omitempty" yaml:"plugin,omitempty"`
}

func (c *Config) Verify() error {
	if c.EphemeralDashboardsCleanupInterval > 0 {
		logrus.Warn("'ephemeral_dashboards_cleanup_interval' is deprecated. Please use the config 'ephemeral_dashboard' instead")
		// This is to avoid an immediate breaking change. This code will be removed for the version v0.49.0
		c.EphemeralDashboard = EphemeralDashboard{
			Enable:          true,
			CleanupInterval: c.EphemeralDashboardsCleanupInterval,
		}
	}
	if c.Schemas != nil {
		logrus.Warn("'schemas' is deprecated. Please remove it from your config")
	}
	if len(c.APIPrefix) > 0 && !strings.HasPrefix(c.APIPrefix, "/") {
		c.APIPrefix = "/" + c.APIPrefix
	}
	// As the global variable depends on the global datasource, we need to disable the global variable if the global datasource is disabled.
	c.Variable.Global.Disable = c.Variable.Global.Disable || c.Datasource.Global.Disable
	// The same logic applies for a project variable with an additional rules.
	// Since a project variable can either depend on a global datasource or a project datasource,
	// we need to disable the project variable if the global datasource is disabled and the project datasource is disabled.
	c.Variable.Project.Disable = c.Variable.Project.Disable || (c.Datasource.Global.Disable && c.Datasource.Project.Disable)
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
