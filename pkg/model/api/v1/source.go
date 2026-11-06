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

package v1

type DiscoveryType string

const (
	KubernetesType DiscoveryType = "kubernetes"
	HTTPType       DiscoveryType = "http"
)

// DiscoverySource identifies the datasource discovery configuration that created a datasource.
type DiscoverySource struct {
	Name string        `json:"name" yaml:"name"`
	Type DiscoveryType `json:"type" yaml:"type"`
}

// Source records where a GlobalDatasource came from.
// Nil means the datasource was created manually.
type Source struct {
	Discovery *DiscoverySource `json:"discovery,omitempty" yaml:"discovery,omitempty"`
}
