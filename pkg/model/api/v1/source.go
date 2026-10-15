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

// ProvisioningSource identifies the provisioning folder and file that created
// or last updated a resource.
type ProvisioningSource struct {
	Folder   string `json:"folder" yaml:"folder"`
	FileName string `json:"fileName" yaml:"fileName"`
}

// DiscoveryType is the mechanism used by the discovery configuration.
type DiscoveryType string

const (
	DiscoveryTypeKubernetes DiscoveryType = "kubernetes"
	DiscoveryTypeHTTP       DiscoveryType = "http"
)

// DiscoverySource identifies the datasource discovery configuration that
// created or last updated a resource.
type DiscoverySource struct {
	Name string        `json:"name" yaml:"name"`
	Type DiscoveryType `json:"type" yaml:"type"`
}

// SCMSource identifies the source control repository that owns a resource.
type SCMSource struct {
	URL string `json:"url" yaml:"url"`
}

// OperatorSource identifies the Kubernetes operator CR that created or last
// updated a resource.
type OperatorSource struct {
	// Cluster is the name of the Kubernetes cluster. Optional: omitted when
	// the operator manages resources within a single known cluster.
	Cluster   string `json:"cluster,omitempty" yaml:"cluster,omitempty"`
	Namespace string `json:"namespace" yaml:"namespace"`
	Kind      string `json:"kind" yaml:"kind"`
	Name      string `json:"name" yaml:"name"`
	// UID is the Kubernetes UID of the CR. Optional: used to detect
	// re-creation of a CR with the same name.
	UID string `json:"uid,omitempty" yaml:"uid,omitempty"`
}

// Source records where a resource originated. At most one field is non-nil.
// When Source itself is nil the resource was created manually via the API.
type Source struct {
	Provisioning *ProvisioningSource `json:"provisioning,omitempty" yaml:"provisioning,omitempty"`
	Discovery    *DiscoverySource    `json:"discovery,omitempty" yaml:"discovery,omitempty"`
	SCM          *SCMSource          `json:"scm,omitempty"          yaml:"scm,omitempty"`
	Operator     *OperatorSource     `json:"operator,omitempty"     yaml:"operator,omitempty"`
}

// Sourceable is implemented by every resource type that carries a Source field.
// The provisioning and discovery subsystems use this interface to stamp and
// read the origin of a resource without depending on concrete types.
type Sourceable interface {
	GetSource() *Source
	SetSource(*Source)
}
