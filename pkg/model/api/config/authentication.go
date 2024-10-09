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

package config

import (
	"errors"
	"fmt"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/common/model"
)

const (
	DefaultAccessTokenTTL  = time.Minute * 15
	DefaultRefreshTokenTTL = time.Hour * 24
	DefaultProviderTimeout = time.Minute * 1
)

type OAuthOverride struct {
	ClientID     secret.Hidden `json:"client_id" yaml:"client_id"`
	ClientSecret secret.Hidden `json:"client_secret" yaml:"client_secret"`
	Scopes       []string      `json:"scopes" yaml:"scopes"`
}

// appendIfMissing will append the value in the slice, only if not already present.
// Will return a boolean saying if the value has been appended or not.
func appendIfMissing[T comparable](slice []T, value T) ([]T, bool) {
	for _, e := range slice {
		if e == value {
			return slice, false
		}
	}
	return append(slice, value), true
}

type HTTP struct {
	Timeout   model.Duration    `json:"timeout" yaml:"timeout"`
	TLSConfig *secret.TLSConfig `json:"tls_config" yaml:"tls_config"`
}

func (h *HTTP) Verify() error {
	if h.Timeout == 0 {
		h.Timeout = model.Duration(DefaultProviderTimeout)
	}
	return nil
}

type Provider struct {
	SlugID            string         `json:"slug_id" yaml:"slug_id"`
	Name              string         `json:"name" yaml:"name"`
	ClientID          secret.Hidden  `json:"client_id" yaml:"client_id"`
	ClientSecret      secret.Hidden  `json:"client_secret,omitempty" yaml:"client_secret,omitempty"`
	DeviceCode        *OAuthOverride `json:"device_code,omitempty" yaml:"device_code,omitempty"`
	ClientCredentials *OAuthOverride `json:"client_credentials,omitempty" yaml:"client_credentials,omitempty"`
	RedirectURI       common.URL     `json:"redirect_uri,omitempty" yaml:"redirect_uri,omitempty"`
	Scopes            []string       `json:"scopes,omitempty" yaml:"scopes,omitempty"`
	HTTP              HTTP           `json:"http" yaml:"http"`
}

func (p *Provider) Verify() error {
	if p.SlugID == "" {
		return errors.New("provider's `slug_id` is mandatory")
	}
	if p.Name == "" {
		return errors.New("provider's `name` is mandatory")
	}
	if p.ClientID == "" {
		return errors.New("provider's `client_id` is mandatory")
	}
	return nil
}

type OIDCProvider struct {
	Provider     `json:",inline" yaml:",inline"`
	Issuer       common.URL        `json:"issuer" yaml:"issuer"`
	DiscoveryURL common.URL        `json:"discovery_url,omitempty" yaml:"discovery_url,omitempty"`
	URLParams    map[string]string `json:"url_params,omitempty" yaml:"url_params,omitempty"`
	DisablePKCE  bool              `json:"disable_pkce" yaml:"disable_pkce"`
}

func (p *OIDCProvider) Verify() error {
	if p.Issuer.IsNilOrEmpty() {
		return errors.New("provider's `issuer` is mandatory")
	}
	return nil
}

type OAuthProvider struct {
	Provider            `json:",inline" yaml:",inline"`
	AuthURL             common.URL `json:"auth_url" yaml:"auth_url"`
	TokenURL            common.URL `json:"token_url" yaml:"token_url"`
	UserInfosURL        common.URL `json:"user_infos_url" yaml:"user_infos_url"`
	DeviceAuthURL       common.URL `json:"device_auth_url" yaml:"device_auth_url"`
	CustomLoginProperty string     `json:"custom_login_property,omitempty" yaml:"custom_login_property,omitempty"`
}

func (p *OAuthProvider) Verify() error {
	if p.AuthURL.IsNilOrEmpty() {
		return errors.New("provider's `auth_url` is mandatory")
	}
	if p.TokenURL.IsNilOrEmpty() {
		return errors.New("provider's `token_url` is mandatory")
	}
	if p.UserInfosURL.IsNilOrEmpty() {
		return errors.New("provider's `user_infos_url` is mandatory")
	}
	return nil
}

type AuthProviders struct {
	EnableNative bool            `json:"enable_native" yaml:"enable_native"`
	OAuth        []OAuthProvider `json:"oauth,omitempty" yaml:"oauth,omitempty"`
	OIDC         []OIDCProvider  `json:"oidc,omitempty" yaml:"oidc,omitempty"`
}

func (p *AuthProviders) Verify() error {
	var tmpOIDCSlugIDs []string
	for _, prov := range p.OIDC {
		var ok bool
		tmpOIDCSlugIDs, ok = appendIfMissing(tmpOIDCSlugIDs, prov.SlugID)
		if !ok {
			return fmt.Errorf("several OIDC providers exist with the same slug_id %q", prov.SlugID)
		}
	}
	var tmpOAuthSlugIDs []string
	for _, prov := range p.OAuth {
		var ok bool
		tmpOAuthSlugIDs, ok = appendIfMissing(tmpOAuthSlugIDs, prov.SlugID)
		if !ok {
			return fmt.Errorf("several OAuth providers exist with the same slug_id %q", prov.SlugID)
		}
	}
	return nil
}

type AuthenticationConfig struct {
	// AccessTokenTTL is the time to live of the access token. By default, it is 15 minutes.
	AccessTokenTTL model.Duration `json:"access_token_ttl,omitempty" yaml:"access_token_ttl,omitempty"`
	// RefreshTokenTTL is the time to live of the refresh token.
	// The refresh token is used to get a new access token when it is expired.
	// By default, it is 24 hours.
	RefreshTokenTTL model.Duration `json:"refresh_token_ttl,omitempty" yaml:"refresh_token_ttl,omitempty"`
	// DisableSignUp deactivates the Sign-up page in the UI.
	// It also disables the endpoint that gives the possibility to create a user.
	DisableSignUp bool `json:"disable_sign_up" yaml:"disable_sign_up"`
	// Providers configure the different authentication providers
	Providers AuthProviders `json:"providers" yaml:"providers"`
}

func (a *AuthenticationConfig) Verify() error {
	if a.AccessTokenTTL == 0 {
		a.AccessTokenTTL = model.Duration(DefaultAccessTokenTTL)
	}
	if a.RefreshTokenTTL == 0 {
		a.RefreshTokenTTL = model.Duration(DefaultRefreshTokenTTL)
	}
	return nil
}
