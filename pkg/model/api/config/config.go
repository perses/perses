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
	"time"

	"github.com/perses/common/config"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

const (
	defaultEphemeralDashboardsCleanupInterval = 24 * time.Hour
)

type EphemeralDashboard struct {
	// When true user will be able to use the ephemeral dashboard at project level.
	Enable bool `json:"enable" yaml:"enable"`
	// The interval at which to trigger the cleanup of ephemeral dashboards, based on their TTLs.
	CleanupInterval model.Duration `json:"cleanup_interval" yaml:"cleanup_interval"`
}

func (e *EphemeralDashboard) Verify() error {
	if e.Enable && e.CleanupInterval <= 0 {
		e.CleanupInterval = model.Duration(defaultEphemeralDashboardsCleanupInterval)
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
	Schemas Schemas `json:"schemas,omitempty" yaml:"schemas,omitempty"`
	// Provisioning contains the provisioning config that can be used if you want to provide default resources.
	Provisioning ProvisioningConfig `json:"provisioning,omitempty" yaml:"provisioning,omitempty"`
	// GlobalDatasourceDiscovery is the configuration that helps to generate a list of global datasource based on the discovery chosen.
	// Be careful: the data coming from the discovery will totally override what exists in the database.
	// Note that this is an experimental feature. Behavior and config may change in the future.
	GlobalDatasourceDiscovery []GlobalDatasourceDiscovery `json:"global_datasource_discovery,omitempty" yaml:"global_datasource_discovery,omitempty"`
	// EphemeralDashboardsCleanupInterval is the interval at which the ephemeral dashboards are cleaned up
	// DEPRECATED.
	// Please use the config EphemeralDashboard instead.
	EphemeralDashboardsCleanupInterval model.Duration `json:"ephemeral_dashboards_cleanup_interval,omitempty" yaml:"ephemeral_dashboards_cleanup_interval,omitempty"`
	// EphemeralDashboard contains the config about the ephemeral dashboard feature
	EphemeralDashboard EphemeralDashboard `json:"ephemeral_dashboard,omitempty" yaml:"ephemeral_dashboard,omitempty"`
	// Frontend contains any config that will be used by the frontend itself.
	Frontend Frontend `json:"frontend,omitempty" yaml:"frontend,omitempty"`
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
