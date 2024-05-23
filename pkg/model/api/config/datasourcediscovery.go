// Copyright 2024 The Perses Authors
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
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/prometheus/common/model"
)

type HTTPDiscovery struct {
	perseshttp.RestConfigClient `json:",inline" yaml:",inline"`
	// The name of the discovery config (optional)
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
	// Refresh interval to re-query the endpoint.
	RefreshInterval model.Duration `json:"refresh_interval,omitempty" yaml:"refresh_interval,omitempty"`
}

type GlobalDatasourceDiscovery struct {
	// HTTP-based service discovery provides a more generic way to generate a set of global datasource and serves as an interface to plug in custom service discovery mechanisms.
	// It fetches an HTTP endpoint containing a list of zero or more global datasources.
	// The target must reply with an HTTP 200 response.
	// The HTTP header Content-Type must be application/json, and the body must be valid array of JSON.
	HTTPDiscovery *HTTPDiscovery `json:"http_sd,omitempty" yaml:"http_sd,omitempty"`
}
