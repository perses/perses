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

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/secret"
)

type SecretSpec struct {
	BasicAuth *secret.BasicAuth `json:"basicAuth,omitempty" yaml:"basicAuth,omitempty"`
	// The HTTP authorization credentials for the targets.
	Authorization *secret.Authorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// Oauth configuration for the targets.
	OAuth *secret.OAuth `json:"oauth,omitempty" yaml:"oauth,omitempty"`
	// TLSConfig to use to connect to the targets.
	TLSConfig *secret.TLSConfig `json:"tlsConfig,omitempty" yaml:"tlsConfig,omitempty"`
	// OAuthPassThrough when true forwards the incoming user's OAuth/OIDC access token to the upstream datasource
	// using an Authorization: Bearer header. This is only applicable for proxy-type datasources (HTTP proxy and SQL proxy).
	// When enabled, the user's token is used instead of any static auth configured in basicAuth, authorization, or oauth.
	OAuthPassThrough bool `json:"oauthPassThrough,omitempty" yaml:"oauthPassThrough,omitempty"`
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

func (s *SecretSpec) UnmarshalYAML(unmarshal func(any) error) error {
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
	nbAuthConfigured := 0
	if s.BasicAuth != nil {
		nbAuthConfigured++
	}
	if s.Authorization != nil {
		nbAuthConfigured++
	}
	if s.OAuth != nil {
		nbAuthConfigured++
	}
	if nbAuthConfigured > 1 {
		return fmt.Errorf("basicAuth, authorization and oauth are mutually exclusive, use one of them")
	}
	if s.OAuthPassThrough && nbAuthConfigured > 0 {
		return fmt.Errorf("oauthPassThrough cannot be used together with basicAuth, authorization, or oauth")
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

func (g *GlobalSecret) GetSpec() any {
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

func (s *Secret) GetSpec() any {
	return s.Spec
}
