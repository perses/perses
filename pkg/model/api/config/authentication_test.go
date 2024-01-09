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
	"os"
	"testing"

	"github.com/perses/common/config"
	"github.com/stretchr/testify/assert"
)

func TestAuthProviders_Verify(t *testing.T) {
	wrongOAuth := AuthProviders{OAuth: []OAuthProvider{{Provider: Provider{SlugID: "hello"}}, {Provider: Provider{SlugID: "hello"}}}}
	assert.ErrorContains(t, wrongOAuth.Verify(), "several OAuth providers exist with the same slug_id")

	wrongOIDC := AuthProviders{OIDC: []OIDCProvider{{Provider: Provider{SlugID: "hello"}}, {Provider: Provider{SlugID: "hello"}}}}
	assert.ErrorContains(t, wrongOIDC.Verify(), "several OIDC providers exist with the same slug_id")
}

// TestProvider_Verify makes sure the Verify of parent struct is well called by the config Resolver
func TestProvider_VerifyParent(t *testing.T) {
	// Make sure it is a valid OIDCProvider but not a valid Provider (Verify of the child is called before the parent's one)
	testYamlInput := `issuer: "http://localhost:4200"`

	// Run the resolver
	err := config.NewResolver[OIDCProvider]().
		SetConfigData([]byte(testYamlInput)).
		Resolve(&OIDCProvider{}).
		Verify()

	// Check the error is well an error coming from the parent "Provider" struct
	assert.ErrorContains(t, err, "`slug_id` is mandatory")
}

// TestProvider_Verify makes sure the Verify of child struct is well called by the config Resolver
func TestProvider_VerifyChild(t *testing.T) {
	// Make sure it is a valid Provider but not a valid OIDCProvider (Verify of the child is called before the parent's one)
	testYamlInput := `
slug_id: "github"
name: "Github"
client_id: "secretthing"
client_secret: "secretthing"
redirect_uri: "http://localhost:8080"
`

	// Run the resolver
	err := config.NewResolver[OIDCProvider]().
		SetConfigData([]byte(testYamlInput)).
		Resolve(&OIDCProvider{}).
		Verify()

	// Check the error is well an error coming from the parent "Provider" struct
	assert.ErrorContains(t, err, "`issuer` is mandatory")
}

// TestProvider_EnvVar ensures env var are well parsed for an embedded common.URL (child and parent)
func TestProvider_EnvVar(t *testing.T) {
	testYamlInput := `
slug_id: "github"
name: "Github"
client_id: "secretthing"
client_secret: "secretthing"
`
	_ = os.Setenv("PREFIX_REDIRECT_URI", "http://localhost:8080")
	_ = os.Setenv("PREFIX_ISSUER", "http://localhost:8181")

	c := &OIDCProvider{}
	// Run the resolver
	err := config.NewResolver[OIDCProvider]().
		SetConfigData([]byte(testYamlInput)).
		SetEnvPrefix("PREFIX").
		Resolve(c).
		Verify()
	assert.NoError(t, err)
	assert.Equal(t, "http://localhost:8080", c.RedirectURI.String())
	assert.Equal(t, "http://localhost:8181", c.Issuer.String())
}
