// Copyright 2023 The Perses Authors
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

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/secret"
)

type SecretSpec struct {
	BasicAuth *secret.BasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.Authorization `yaml:"authorization,omitempty" json:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig secret.TLSConfig `yaml:"tls_config,omitempty" json:"tls_config,omitempty"`
}

func (s *SecretSpec) UnmarshalJSON(data []byte) error {
	var tmp SecretSpec
	type plain SecretSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *SecretSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp SecretSpec
	type plain SecretSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *SecretSpec) validate() error {
	if s.BasicAuth == nil && s.Authorization == nil {
		return fmt.Errorf("at most one of basic_auth and authorization must be configured")
	}
	if s.BasicAuth != nil && s.Authorization != nil {
		return fmt.Errorf("basic_auth and authorization are mutually exclusive, use one of them")
	}
	return nil
}

type GlobalSecret struct {
	Kind     Kind       `json:"kind" yaml:"kind"`
	Metadata Metadata   `json:"metadata" yaml:"metadata"`
	Spec     SecretSpec `json:"spec" yaml:"spec"`
}

func (g *GlobalSecret) GetMetadata() modelAPI.Metadata {
	return &g.Metadata
}

func (g *GlobalSecret) GetKind() string {
	return string(g.Kind)
}

func (g *GlobalSecret) GetSpec() interface{} {
	return g.Spec
}

type Secret struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     SecretSpec      `json:"spec" yaml:"spec"`
}

func (s *Secret) GetMetadata() modelAPI.Metadata {
	return &s.Metadata
}

func (s *Secret) GetKind() string {
	return string(s.Kind)
}

func (s *Secret) GetSpec() interface{} {
	return s.Spec
}
