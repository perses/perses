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

	"github.com/perses/perses/internal/api/shared/utils"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/common/model"
)

const (
	DefaultAccessTokenTTL  = time.Minute * 15
	DefaultRefreshTokenTTL = time.Hour * 24
)

type Provider struct {
	SlugID       string        `json:"slug_id" yaml:"slug_id"`
	Name         string        `json:"name" yaml:"name"`
	ClientID     secret.Hidden `json:"client_id" yaml:"client_id"`
	ClientSecret secret.Hidden `json:"client_secret" yaml:"client_secret"`
	RedirectURI  common.URL    `json:"redirect_uri" yaml:"redirect_uri"`
	Scopes       []string      `json:"scopes" yaml:"scopes"`
	DisablePKCE  bool          `json:"disable_pkce" yaml:"disable_pkce"`
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
	if p.ClientSecret == "" {
		return errors.New("provider's `client_secret` is mandatory")
	}
	return nil
}

type OIDCProvider struct {
	Provider     `json:",inline" yaml:",inline"`
	Issuer       common.URL        `json:"issuer" yaml:"issuer"`
	DiscoveryURL common.URL        `json:"discovery_url" yaml:"discovery_url"`
	URLParams    map[string]string `json:"url_params" yaml:"url_params"`
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
	CustomLoginProperty string     `json:"custom_login_property" yaml:"custom_login_property"`
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
		tmpOIDCSlugIDs, ok = utils.AppendIfMissing(tmpOIDCSlugIDs, prov.SlugID)
		if !ok {
			return fmt.Errorf("several OIDC providers exist with the same slug_id %q", prov.SlugID)
		}
	}
	var tmpOAuthSlugIDs []string
	for _, prov := range p.OAuth {
		var ok bool
		tmpOAuthSlugIDs, ok = utils.AppendIfMissing(tmpOAuthSlugIDs, prov.SlugID)
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
