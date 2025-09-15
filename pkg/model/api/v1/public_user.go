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

type PublicNativeProvider struct {
	Password secret.Hidden `json:"password,omitempty" yaml:"password,omitempty"`
}

type PublicUserSpec struct {
	FirstName      string               `json:"firstName,omitempty" yaml:"firstName,omitempty"`
	LastName       string               `json:"lastName,omitempty" yaml:"lastName,omitempty"`
	NativeProvider PublicNativeProvider `json:"nativeProvider,omitempty" yaml:"nativeProvider,omitempty"`
	OauthProviders []OAuthProvider      `json:"oauthProviders,omitempty" yaml:"oauthProviders,omitempty"`
}

func NewPublicUserSpec(u UserSpec) PublicUserSpec {
	return PublicUserSpec{
		FirstName: u.FirstName,
		LastName:  u.LastName,
		NativeProvider: PublicNativeProvider{
			Password: secret.Hidden(u.NativeProvider.Password),
		},
		OauthProviders: u.OauthProviders,
	}
}

type PublicUser struct {
	Kind     Kind           `json:"kind"`
	Metadata Metadata       `json:"metadata"`
	Spec     PublicUserSpec `json:"spec"`
}

func (u *PublicUser) GetMetadata() modelAPI.Metadata {
	return &u.Metadata
}

func (u *PublicUser) GetKind() string {
	return string(u.Kind)
}

func (u *PublicUser) GetSpec() any {
	return u.Spec
}

func NewPublicUser(u *User) *PublicUser {
	if u == nil {
		return nil
	}
	return &PublicUser{
		Kind:     u.Kind,
		Metadata: u.Metadata,
		Spec:     NewPublicUserSpec(u.Spec),
	}
}
