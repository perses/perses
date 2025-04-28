// Copyright 2025 The Perses Authors
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

package secret

import (
	"encoding/json"
	"fmt"
	"os"
)

type PublicOAuth struct {
	ClientID         Hidden              `json:"clientID" yaml:"clientID"`
	ClientSecret     Hidden              `json:"clientSecret" yaml:"clientSecret"`
	ClientSecretFile string              `json:"clientSecretFile" yaml:"clientSecretFile"`
	TokenURL         string              `json:"tokenURL" yaml:"tokenURL"`
	Scopes           []string            `json:"scopes" yaml:"scopes"`
	EndpointParams   map[string][]string `json:"endpointParams" yaml:"endpointParams"`
	AuthStyle        int                 `json:"authStyle" yaml:"authStyle"`
}

func NewPublicOAuth(oauth *OAuth) *PublicOAuth {
	if oauth == nil {
		return nil
	}

	return &PublicOAuth{
		ClientID:         Hidden(oauth.ClientID),
		ClientSecret:     Hidden(oauth.ClientSecret),
		ClientSecretFile: oauth.ClientSecretFile,
		TokenURL:         oauth.TokenURL,
		Scopes:           oauth.Scopes,
		EndpointParams:   oauth.EndpointParams,
		AuthStyle:        oauth.AuthStyle,
	}
}

type OAuth struct {
	// ClientID is the application's ID.
	ClientID string `json:"clientID" yaml:"clientID"`
	// ClientSecret is the application's secret.
	ClientSecret     string `json:"clientSecret" yaml:"clientSecret"`
	ClientSecretFile string `json:"clientSecretFile" yaml:"clientSecretFile"`
	// TokenURL is the resource server's token endpoint
	// URL. This is a constant specific to each server.
	TokenURL string `json:"tokenURL" yaml:"tokenURL"`
	// Scope specifies optional requested permissions.
	Scopes []string `json:"scopes" yaml:"scopes"`
	// EndpointParams specifies additional parameters for requests to the token endpoint.
	EndpointParams map[string][]string `json:"endpointParams" yaml:"endpointParams"`
	// AuthStyle optionally specifies how the endpoint wants the
	// client ID & client secret sent. The zero value means to
	// auto-detect.
	AuthStyle int `json:"authStyle" yaml:"authStyle"`
}

func (o *OAuth) UnmarshalJSON(data []byte) error {
	var tmp OAuth
	type plain OAuth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*o = tmp
	return nil
}

func (o *OAuth) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp OAuth
	type plain OAuth
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*o = tmp
	return nil
}

func (o *OAuth) GetClientSecret() (string, error) {
	if len(o.ClientSecretFile) > 0 {
		clientSecret, err := os.ReadFile(o.ClientSecretFile)
		if err != nil {
			return "", fmt.Errorf("failed to read clientSecretFile: %w", err)
		}
		return string(clientSecret), nil
	}

	return o.ClientSecret, nil
}

func (o *OAuth) validate() error {
	if len(o.ClientID) == 0 || (len(o.ClientSecret) == 0 && len(o.ClientSecretFile) == 0) || len(o.TokenURL) == 0 {
		return fmt.Errorf("when using oauth, clientID, clientSecret/clientSecretFile, and tokenURL cannot be empty")
	}
	if len(o.ClientSecret) > 0 && len(o.ClientSecretFile) > 0 {
		return fmt.Errorf("at most one of oauth clientSecret & clientSecretFile must be configured")
	}
	return nil
}
