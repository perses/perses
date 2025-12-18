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
	"net/url"

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type oAuthUserInfo struct {
	ExternalUserInfoProfile
	loginProps []string
	authURL    url.URL
}

func NewOAuthUserInfo(authURL url.URL, loginProps []string) ExternalUserInfo {
	return &oAuthUserInfo{authURL: authURL, loginProps: loginProps}
}

// GetLogin implements [externalUserInfo]
func (u *oAuthUserInfo) GetLogin() string {
	return u.getLogin(u.loginProps)
}

// GetProfile implements [externalUserInfo]
func (u *oAuthUserInfo) GetProfile() ExternalUserInfoProfile {
	return u.ExternalUserInfoProfile
}

// GetProviderContext implements [externalUserInfo]
func (u *oAuthUserInfo) GetProviderContext() v1.OAuthProvider {
	return v1.OAuthProvider{
		// As there's no particular issuer in oauth2 generic, we recreate a fake issuer from authURL
		Issuer:  u.authURL.Hostname(),
		Email:   u.Email,
		Subject: u.GetLogin(),
	}
}
