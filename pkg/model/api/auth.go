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

package api

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/zitadel/oidc/v3/pkg/oidc"
)

type PublicAuth struct {
	Login    string        `json:"login"`
	Password secret.Hidden `json:"password"`
}

func NewPublicAuth(auth *Auth) *PublicAuth {
	if auth == nil {
		return nil
	}
	return &PublicAuth{
		Login:    auth.Login,
		Password: secret.Hidden(auth.Password),
	}
}

type Auth struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func (u *Auth) UnmarshalJSON(data []byte) error {
	type plain Auth
	var tmp Auth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if len(tmp.Login) == 0 {
		return fmt.Errorf("login cannot be empty")
	}
	if len(tmp.Password) == 0 {
		return fmt.Errorf("password cannot be empty")
	}
	u.Password = tmp.Password
	u.Login = tmp.Login
	return nil
}

// RefreshRequest represents the request used to refresh an access token from a refresh token.
// Disclaimer: This is an exception to the general camelCase convention in the project, to respect oauth 2.0 specs.
// -> https://datatracker.ietf.org/doc/html/rfc6749#section-6
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (r *RefreshRequest) UnmarshalJSON(data []byte) error {
	var tmp RefreshRequest
	type plain RefreshRequest
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *RefreshRequest) validate() error {
	if len(r.RefreshToken) == 0 {
		return fmt.Errorf("refreshToken cannot be empty")
	}
	return nil
}

// GrantType is a subset of the OAuth 2.0 grant types.
// In our case, we will explicitly need them only in the /token endpoint, that we are using
// only in the context of device code flow and client credentials flow.
type GrantType oidc.GrantType

const (
	GrantTypeDeviceCode        = GrantType(oidc.GrantTypeDeviceCode)
	GrantTypeClientCredentials = GrantType(oidc.GrantTypeClientCredentials)
)

// TokenRequest represents the body of a /token endpoint request.
// DeviceCode or ClientID, ClientSecret will be necessary based on the grant type.
type TokenRequest struct {
	GrantType    GrantType `json:"grant_type"`
	DeviceCode   string    `json:"device_code"`
	ClientID     string    `json:"client_id"`
	ClientSecret string    `json:"client_secret"`
}

func (r *TokenRequest) UnmarshalJSON(data []byte) error {
	var tmp TokenRequest
	type plain TokenRequest
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *TokenRequest) validate() error {
	switch r.GrantType {
	case GrantTypeDeviceCode:
		if len(r.DeviceCode) == 0 {
			return fmt.Errorf("device_code cannot be empty when grant_type is %s", r.GrantType)
		}
	case GrantTypeClientCredentials:
		if len(r.ClientID) == 0 {
			return fmt.Errorf("client_id cannot be empty when grant_type is %s", r.GrantType)
		}
		if len(r.ClientSecret) == 0 {
			return fmt.Errorf("client_secret cannot be empty when grant_type is %s", r.GrantType)
		}
	}
	return nil
}

// OAuthError represents the error response of a possible oauth endpoint.
// It is used to control the error type in the response of the backend request (client and server side)
// It helps for example when polling device access token to know if the device code is still valid, or if we need to
// slow down, etc ...
// Refs:
// https://www.rfc-editor.org/rfc/rfc8628#section-3.5
// https://www.rfc-editor.org/rfc/rfc6749#section-5.2
type OAuthError struct {
	ErrorCode        string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

// Error makes it an error, which can be convenient.
func (e *OAuthError) Error() string {
	return fmt.Sprintf("oauth2: %q %q", e.ErrorCode, e.ErrorDescription)
}
