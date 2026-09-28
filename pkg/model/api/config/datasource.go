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

import "fmt"

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

// HTTPProxyConfig contains the configuration of the proxy used to forward the requests to the datasources of kind HTTPProxy.
type HTTPProxyConfig struct {
	// MaxConnsPerHost limits the total number of connections (in use and idle) that Perses opens,
	// for a given datasource, to a given host.
	// Once the limit is reached, the new requests wait until a connection is available,
	// or until they are canceled.
	// It can be used to protect Perses (file descriptors) and the datasources from a burst of queries.
	// Zero means no limit.
	MaxConnsPerHost int `json:"max_conns_per_host,omitempty" yaml:"max_conns_per_host,omitempty"`
}

func (c *HTTPProxyConfig) Verify() error {
	if c.MaxConnsPerHost < 0 {
		return fmt.Errorf("datasource.http_proxy.max_conns_per_host cannot be negative")
	}
	return nil
}

type DatasourceConfig struct {
	Global  GlobalDatasourceConfig  `json:"global" yaml:"global"`
	Project ProjectDatasourceConfig `json:"project" yaml:"project"`
	// DisableLocal when used is preventing the possibility to add a datasource directly in the dashboard spec.
	// It will also disable the associated proxy.
	DisableLocal bool `json:"disable_local" yaml:"disable_local"`
	// HTTPProxy contains the configuration of the proxy used to forward the requests to the datasources of kind HTTPProxy.
	// +optional
	HTTPProxy HTTPProxyConfig `json:"http_proxy,omitzero" yaml:"http_proxy,omitempty"`
}
