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
	"fmt"

	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/prometheus/common/model"
)

type HTTPDiscovery struct {
	perseshttp.RestConfigClient `json:",inline" yaml:",inline"`
}

type KubeServiceDiscovery struct {
	// Name of the service port for the target.
	PortName string `json:"port_name,omitempty" yaml:"port_name,omitempty"`
	// Number of the service port for the target.
	PortNumber int32 `json:"port_number,omitempty" yaml:"port_number,omitempty"`
	// The type of the service.
	ServiceType string `json:"service_type,omitempty" yaml:"service_type,omitempty"`
}

type KubePodDiscovery struct {
	// Name of the container the target address points to.
	ContainerName string `json:"container_name,omitempty" yaml:"container_name,omitempty"`
	// Name of the container port.
	ContainerPortName string `json:"container_port_name,omitempty" yaml:"container_port_name,omitempty"`
	// Number of the container port.
	ContainerPortNumber int32 `json:"container_port_number,omitempty" yaml:"container_port_number,omitempty"`
}

type KubernetesDiscovery struct {
	// DatasourcePluginKind is the name of the datasource plugin that should be filled when creating datasources found.
	DatasourcePluginKind string `json:"datasource_plugin_kind" yaml:"datasource_plugin_kind"`
	// Kubernetes namespace to constraint the query to only one namespace.
	// Leave empty if you are looking for datasource cross-namespace.
	Namespace string `json:"namespace" yaml:"namespace"`
	// Configuration when you want to discover the services in Kubernetes
	ServiceConfiguration *KubeServiceDiscovery `json:"service_configuration,omitempty" yaml:"service_configuration,omitempty"`
	// Configuration when you want to discover the pods in Kubernetes
	PodConfiguration *KubePodDiscovery `json:"pod_configuration,omitempty" yaml:"pod_configuration,omitempty"`
	// The labels used to filter the list of resource when contacting the Kubernetes API.
	Labels map[string]string `json:"labels,omitempty" yaml:"labels,omitempty"`
}

func (d *KubernetesDiscovery) Verify() error {
	if len(d.DatasourcePluginKind) == 0 {
		return fmt.Errorf("missing datasource plugin kind")
	}
	if d.ServiceConfiguration == nil && d.PodConfiguration == nil {
		return fmt.Errorf("at least one of service_configuration or pod_configuration must be set")
	}
	return nil
}

type GlobalDatasourceDiscovery struct {
	// The name of the discovery config (optional)
	DiscoveryName string `json:"discovery_name,omitempty" yaml:"discovery_name,omitempty"`
	// Refresh interval to re-query the endpoint.
	RefreshInterval model.Duration `json:"refresh_interval,omitempty" yaml:"refresh_interval,omitempty"`
	// HTTP-based service discovery provides a more generic way to generate a set of global datasource and serves as an interface to plug in custom service discovery mechanisms.
	// It fetches an HTTP endpoint containing a list of zero or more global datasources.
	// The target must reply with an HTTP 200 response.
	// The HTTP header Content-Type must be application/json, and the body must be valid array of JSON.
	HTTPDiscovery *HTTPDiscovery `json:"http_sd,omitempty" yaml:"http_sd,omitempty"`
	// Kubernetes SD configurations allow retrieving global datasource from Kubernetes' REST API
	// and always staying synchronized with the cluster state.
	KubernetesDiscovery *KubernetesDiscovery `json:"kubernetes_sd,omitempty" yaml:"kubernetes_sd,omitempty"`
}

func (g *GlobalDatasourceDiscovery) Verify() error {
	if len(g.DiscoveryName) == 0 {
		return fmt.Errorf("global datasource discovery name is empty")
	}
	if g.RefreshInterval == 0 {
		return fmt.Errorf("global datasource discovery refresh_interval is zero")
	}
	if g.HTTPDiscovery == nil && g.KubernetesDiscovery == nil {
		return fmt.Errorf("no discovery has been defined for the global datasource discovery %q", g.DiscoveryName)
	}
	return nil
}
