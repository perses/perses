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

package secret

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// PublicAuthorization is the public struct of Authorization.
// It's used when the API returns a response to a request
type PublicAuthorization struct {
	Type            string `json:"type" yaml:"type"`
	Credentials     Hidden `json:"credentials,omitempty" yaml:"credentials,omitempty"`
	CredentialsFile string `json:"credentials_file,omitempty" yaml:"credentials_file,omitempty"`
}

func NewPublicAuthorization(a *Authorization) *PublicAuthorization {
	if a == nil {
		return nil
	}
	return &PublicAuthorization{
		Type:            a.Type,
		Credentials:     Hidden(a.Credentials),
		CredentialsFile: a.CredentialsFile,
	}
}

// Authorization contains HTTP authorization credentials.
type Authorization struct {
	Type            string `json:"type,omitempty" yaml:"type,omitempty"`
	Credentials     string `json:"credentials,omitempty" yaml:"credentials,omitempty"`
	CredentialsFile string `json:"credentials_file,omitempty" yaml:"credentials_file,omitempty"`
}

func (a *Authorization) UnmarshalJSON(data []byte) error {
	var tmp Authorization
	type plain Authorization
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*a = tmp
	return nil
}

func (a *Authorization) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Authorization
	type plain Authorization
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*a = tmp
	return nil
}

func (a *Authorization) GetCredentials() (string, error) {
	if len(a.CredentialsFile) > 0 {
		data, err := os.ReadFile(a.CredentialsFile)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}
	return a.Credentials, nil
}

func (a *Authorization) validate() error {
	if len(a.Credentials) > 0 && len(a.CredentialsFile) > 0 {
		return fmt.Errorf("at most one of authorization credentials & credentials_file must be configured")
	}
	a.Type = strings.TrimSpace(a.Type)
	if len(a.Type) == 0 {
		a.Type = "Bearer"
	}
	if strings.ToLower(a.Type) == "basic" {
		return fmt.Errorf(`authorization type cannot be set to "basic", use "basic_auth" instead`)
	}
	return nil
}
