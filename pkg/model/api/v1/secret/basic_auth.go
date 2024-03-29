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
)

// PublicBasicAuth is the public struct of BasicAuth.
// It's used when the API returns a response to a request
type PublicBasicAuth struct {
	Username     string `json:"username" yaml:"username"`
	Password     Hidden `json:"password,omitempty" yaml:"password,omitempty"`
	PasswordFile string `json:"passwordFile,omitempty" yaml:"passwordFile,omitempty"`
}

func NewPublicBasicAuth(b *BasicAuth) *PublicBasicAuth {
	if b == nil {
		return nil
	}
	return &PublicBasicAuth{
		Username:     b.Username,
		Password:     Hidden(b.Password),
		PasswordFile: b.PasswordFile,
	}
}

type BasicAuth struct {
	Username string `json:"username" yaml:"username"`
	Password string `json:"password,omitempty" yaml:"password,omitempty"`
	// PasswordFile is a path to a file that contains a password
	PasswordFile string `json:"passwordFile,omitempty" yaml:"passwordFile,omitempty"`
}

func (b *BasicAuth) UnmarshalJSON(data []byte) error {
	var tmp BasicAuth
	type plain BasicAuth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *BasicAuth) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp BasicAuth
	type plain BasicAuth
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *BasicAuth) GetPassword() (string, error) {
	if len(b.PasswordFile) > 0 {
		data, err := os.ReadFile(b.PasswordFile)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}
	return b.Password, nil
}

func (b *BasicAuth) validate() error {
	if len(b.Username) == 0 || (len(b.Password) == 0 && len(b.PasswordFile) == 0) {
		return fmt.Errorf("when using basicAuth, username and password/password_file cannot be empty")
	}
	if len(b.Password) > 0 && len(b.PasswordFile) > 0 {
		return fmt.Errorf("at most one of basicAuth password & password_file must be configured")
	}
	return nil
}
