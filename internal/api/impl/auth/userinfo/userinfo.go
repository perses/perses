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

package userinfo

import (
	"encoding/json"
	"fmt"
	"strings"

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

// ExternalUserInfoProfile is a subset of oidc.UserInfoProfile structure with only the interesting information.
type ExternalUserInfoProfile struct {
	Name              string `json:"name,omitempty"`
	GivenName         string `json:"given_name,omitempty"`
	FamilyName        string `json:"family_name,omitempty"`
	MiddleName        string `json:"middle_name,omitempty"`
	Nickname          string `json:"nickname,omitempty"`
	Profile           string `json:"profile,omitempty"`
	Picture           string `json:"picture,omitempty"`
	PreferredUsername string `json:"preferred_username,omitempty"`
	Email             string `json:"email,omitempty"`
	rawProperties     map[string]interface{}
}

// ExternalUserInfo defines the way to build user info which is different according to each provider kind.
type ExternalUserInfo interface {
	// GetLogin returns the login designating the ``metadata.name`` of the user entity.
	GetLogin() string
	// GetProfile returns various user information that may be set in the ``specs`` of the user entity.
	GetProfile() ExternalUserInfoProfile
	// GetProviderContext returns the provider context. It identifies the external provider used to collect this user
	// information, as well as the identity of the user in that context.
	GetProviderContext() v1.OAuthProvider
}

func (u *ExternalUserInfoProfile) UnmarshalJSON(bytes []byte) error {
	rawProperties := make(map[string]interface{})
	if err := json.Unmarshal(bytes, &rawProperties); err != nil {
		return err
	}

	type plain ExternalUserInfoProfile
	var tmp ExternalUserInfoProfile
	if err := json.Unmarshal(bytes, (*plain)(&tmp)); err != nil {
		return err
	}
	*u = tmp
	u.rawProperties = rawProperties

	return nil
}

func (u *ExternalUserInfoProfile) getLogin(loginProps []string) string {
	if login := u.getProperty(loginProps); login != "" {
		return login
	}
	return strings.Split(u.Email, "@")[0]
}

func (u *ExternalUserInfoProfile) getProperty(keys []string) string {
	for _, key := range keys {
		if value, ok := u.rawProperties[key]; ok {
			// Ensure it is a string. This makes sure for example that an int is well transformed into a string
			return fmt.Sprint(value)
		}
	}
	return ""
}
