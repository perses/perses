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

import (
	"encoding/json"
	"fmt"
)

type DiscoveryType string

const (
	// DiscoveryTypeKubernetes identifies a datasource discovered via Kubernetes service discovery.
	DiscoveryTypeKubernetes DiscoveryType = "kubernetes"
	// DiscoveryTypeHTTP identifies a datasource discovered via HTTP-based service discovery.
	DiscoveryTypeHTTP DiscoveryType = "http"
)

func (d *DiscoveryType) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	switch DiscoveryType(s) {
	case DiscoveryTypeKubernetes, DiscoveryTypeHTTP:
		*d = DiscoveryType(s)
		return nil
	default:
		return fmt.Errorf("unknown discovery type %q", s)
	}
}

// DiscoverySource identifies the datasource discovery configuration that created a datasource.
type DiscoverySource struct {
	Name string        `json:"name" yaml:"name"`
	Type DiscoveryType `json:"type" yaml:"type"`
}

func (ds *DiscoverySource) validate() error {
	if ds.Name == "" {
		return fmt.Errorf("discovery source name must not be empty")
	}
	return nil
}

// Source records where a GlobalDatasource came from.
// A nil Source means the datasource was not created by a discovery process:
// it may have been created manually via the API, provisioned via DaC, or
// it was created before datasource discovery was introduced.
type Source struct {
	Discovery *DiscoverySource `json:"discovery,omitempty" yaml:"discovery,omitempty"`
}

// GetDiscovery returns the DiscoverySource if s is non-nil and has a discovery set, otherwise nil.
func (s *Source) GetDiscovery() *DiscoverySource {
	if s == nil {
		return nil
	}
	return s.Discovery
}

func (s *Source) validate() error {
	if s.Discovery != nil {
		return s.Discovery.validate()
	}
	return nil
}
