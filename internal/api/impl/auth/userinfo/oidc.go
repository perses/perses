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

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

// OIDCUserInfo implements the externalUserInfo interface for OIDC providers.
//
// This struct has unexported fields that cannot be set via a constructor.
// It is designed to be initialized exclusively through JSON unmarshaling
// performed by the OIDC library.
//
// Why no constructor?
// The OIDC library expects this type to be populated directly from JSON responses,
// so the usual constructor pattern is not applicable.
//
// Usage pattern:
//  1. Initialization:
//     The struct is created during JSON unmarshaling of OIDC user information.
//  2. Setters:
//     After unmarshaling, certain fields must be set using the provided setter methods.
//     These setters should be called before any getter methods are used.
//  3. Getters:
//     Once all required setters have been invoked, getters can safely retriev
type OIDCUserInfo struct {
	ExternalUserInfoProfile
	Subject string
	// issuer is not supposed to be taken from json, but instead it must be set right before the db sync.
	issuer string
	// loginProps is not supposed to be taken from json, but instead it must be set right before the db sync.
	loginProps []string
}

func (u *OIDCUserInfo) SetLoginProps(props []string) {
	u.loginProps = props
}

func (u *OIDCUserInfo) SetIssuer(issuer string) {
	u.issuer = issuer
}

// GetSubject implements [rp.SubjectGetter]
func (u *OIDCUserInfo) GetSubject() string {
	return u.Subject
}

// GetLogin implements [externalUserInfo]
// It uses the first part of the email to create the username.
func (u *OIDCUserInfo) GetLogin() string {
	if login := u.getLogin(u.loginProps); len(login) > 0 {
		return login
	}
	return u.Subject
}

// GetProfile implements [externalUserInfo]
func (u *OIDCUserInfo) GetProfile() ExternalUserInfoProfile {
	return u.ExternalUserInfoProfile
}

// GetProviderContext implements [externalUserInfo]
func (u *OIDCUserInfo) GetProviderContext() v1.OAuthProvider {
	return v1.OAuthProvider{
		Issuer:  u.issuer,
		Email:   u.Email,
		Subject: u.Subject,
	}
}

// UnmarshalJSON handles the unmarshalling of OIDCUserInfo by ensuring both the embedded
// ExternalUserInfoProfile fields and the Subject field are properly populated.
// Note that `json:",inline"` would work only if the unmarshalled structure is initialized,
// and it's not the case in the OIDC library we use.
func (u *OIDCUserInfo) UnmarshalJSON(bytes []byte) error {
	// First, unmarshal into the embedded ExternalUserInfoProfile to get all the profile fields
	if err := json.Unmarshal(bytes, &u.ExternalUserInfoProfile); err != nil {
		return err
	}

	// Then extract the Subject field separately
	type subjectOnly struct {
		Subject string `json:"sub,omitempty"`
	}
	var s subjectOnly
	if err := json.Unmarshal(bytes, &s); err != nil {
		return err
	}
	u.Subject = s.Subject

	return nil
}
