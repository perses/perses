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
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/secret"
)

type PublicSecretSpec struct {
	BasicAuth *secret.PublicBasicAuth `json:"basicAuth,omitempty" yaml:"basicAuth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.PublicAuthorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.PublicTLSConfig `json:"tlsConfig,omitempty" yaml:"tlsConfig,omitempty"`
}

func NewPublicSecretSpec(s SecretSpec) PublicSecretSpec {
	return PublicSecretSpec{
		BasicAuth:     secret.NewPublicBasicAuth(s.BasicAuth),
		Authorization: secret.NewPublicAuthorization(s.Authorization),
		TLSConfig:     secret.NewPublicTLSConfig(s.TLSConfig),
	}
}

type PublicGlobalSecret struct {
	Kind     Kind             `json:"kind" yaml:"kind"`
	Metadata Metadata         `json:"metadata" yaml:"metadata"`
	Spec     PublicSecretSpec `json:"spec" yaml:"spec"`
}

func NewPublicGlobalSecret(s *GlobalSecret) *PublicGlobalSecret {
	if s == nil {
		return nil
	}
	return &PublicGlobalSecret{
		Kind:     s.Kind,
		Metadata: s.Metadata,
		Spec:     NewPublicSecretSpec(s.Spec),
	}
}

func (g *PublicGlobalSecret) GetMetadata() modelAPI.Metadata {
	return &g.Metadata
}

func (g *PublicGlobalSecret) GetKind() string {
	return string(g.Kind)
}

func (g *PublicGlobalSecret) GetSpec() interface{} {
	return g.Spec
}

type PublicSecret struct {
	Kind     Kind             `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata  `json:"metadata" yaml:"metadata"`
	Spec     PublicSecretSpec `json:"spec" yaml:"spec"`
}

func NewPublicSecret(s *Secret) *PublicSecret {
	if s == nil {
		return nil
	}
	return &PublicSecret{
		Kind:     s.Kind,
		Metadata: s.Metadata,
		Spec:     NewPublicSecretSpec(s.Spec),
	}
}

func (s *PublicSecret) GetMetadata() modelAPI.Metadata {
	return &s.Metadata
}

func (s *PublicSecret) GetKind() string {
	return string(s.Kind)
}

func (s *PublicSecret) GetSpec() interface{} {
	return s.Spec
}
