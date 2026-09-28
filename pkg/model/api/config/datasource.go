// Copyright The Perses Authors
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
	"fmt"
	"time"

	"github.com/perses/spec/go/common"
)

const defaultHTTPProxyTimeout = 30 * time.Second

type GlobalDatasourceConfig struct {
	// Disable is used to disable the global datasource feature.
	// It will also remove the associated proxy.
	// Also, since the global variable depends on the global datasource, it will also disable the global variable feature.
	Disable bool `json:"disable" yaml:"disable"`
	// Discovery is the configuration that helps to generate a list of global datasource based on the discovery chosen.
	// Be careful: the data coming from the discovery will totally override what exists in the database.
	// Note that this is an experimental feature. Behavior and config may change in the future.
	Discovery []GlobalDatasourceDiscovery `json:"discovery,omitempty" yaml:"discovery,omitempty"`
}

func (c *GlobalDatasourceConfig) Verify() error {
	if c.Disable && len(c.Discovery) > 0 {
		return fmt.Errorf("the global datasource is disabled, you cannot use the discovery feature")
	}
	return nil
}

type ProjectDatasourceConfig struct {
	// Disable is used to disable the project datasource feature.
	// It will also remove the associated proxy.
	Disable bool `json:"disable" yaml:"disable"`
}

type DatasourceConfig struct {
	Global  GlobalDatasourceConfig  `json:"global" yaml:"global"`
	Project ProjectDatasourceConfig `json:"project" yaml:"project"`
	// HTTPProxyDefaultTimeout is the connection timeout used when a datasource does not define one or sets it to zero.
	HTTPProxyDefaultTimeout common.Duration `json:"http_proxy_default_timeout,omitempty" yaml:"http_proxy_default_timeout,omitempty"`
	// HTTPProxyMaxTimeout is the maximum connection timeout a datasource may request.
	HTTPProxyMaxTimeout common.Duration `json:"http_proxy_max_timeout,omitempty" yaml:"http_proxy_max_timeout,omitempty"`
	// DisableLocal when used is preventing the possibility to add a datasource directly in the dashboard spec.
	// It will also disable the associated proxy.
	DisableLocal bool `json:"disable_local" yaml:"disable_local"`
}

func (c *DatasourceConfig) Verify() error {
	if c.HTTPProxyDefaultTimeout < 0 {
		return fmt.Errorf("the HTTP proxy default timeout cannot be negative")
	}
	if c.HTTPProxyMaxTimeout < 0 {
		return fmt.Errorf("the HTTP proxy maximum timeout cannot be negative")
	}
	if c.HTTPProxyDefaultTimeout == 0 {
		c.HTTPProxyDefaultTimeout = common.Duration(defaultHTTPProxyTimeout)
	}
	if c.HTTPProxyMaxTimeout == 0 {
		c.HTTPProxyMaxTimeout = common.Duration(defaultHTTPProxyTimeout)
	}
	if c.HTTPProxyDefaultTimeout > c.HTTPProxyMaxTimeout {
		return fmt.Errorf("the HTTP proxy default timeout cannot exceed the maximum timeout")
	}
	return nil
}

func (c DatasourceConfig) GetHTTPProxyMaxTimeout() time.Duration {
	if c.HTTPProxyMaxTimeout <= 0 {
		return defaultHTTPProxyTimeout
	}
	return time.Duration(c.HTTPProxyMaxTimeout)
}

func (c DatasourceConfig) GetHTTPProxyDefaultTimeout() time.Duration {
	defaultTimeout := time.Duration(c.HTTPProxyDefaultTimeout)
	if defaultTimeout <= 0 {
		defaultTimeout = defaultHTTPProxyTimeout
	}
	return min(defaultTimeout, c.GetHTTPProxyMaxTimeout())
}
