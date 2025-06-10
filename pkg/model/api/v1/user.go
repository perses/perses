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
)

type NativeProvider struct {
	Password string `json:"password,omitempty" yaml:"password,omitempty"`
}

type OAuthProvider struct {
	Issuer  string `json:"issuer,omitempty" yaml:"issuer,omitempty"`
	Email   string `json:"email,omitempty" yaml:"email,omitempty"`
	Subject string `json:"subject,omitempty" yaml:"subject,omitempty"`
}

type UserSpec struct {
	FirstName      string          `json:"firstName,omitempty" yaml:"firstName,omitempty"`
	LastName       string          `json:"lastName,omitempty" yaml:"lastName,omitempty"`
	NativeProvider NativeProvider  `json:"nativeProvider,omitempty" yaml:"nativeProvider,omitempty"`
	OauthProviders []OAuthProvider `json:"oauthProviders,omitempty" yaml:"oauthProviders,omitempty"`
}

type User struct {
	Kind     Kind     `json:"kind"`
	Metadata Metadata `json:"metadata"`
	Spec     UserSpec `json:"spec"`
}

func (u *User) GetMetadata() modelAPI.Metadata {
	return &u.Metadata
}

func (u *User) GetKind() string {
	return string(u.Kind)
}

func (u *User) GetSpec() interface{} {
	return u.Spec
}

func (u *User) UnmarshalJSON(data []byte) error {
	var tmp User
	type plain User
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*u = tmp
	return nil
}

func (u *User) validate() error {
	if u.Kind != KindUser {
		return fmt.Errorf("invalid kind: '%s' for a User type", u.Kind)
	}
	return nil
}
