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
func TestProvider_Verify(t *testing.T) {
	// Make sure it a valid OIDCProvider but not a valid Provider (Verify of the son is call before the parent's one)
	testYamlInput := `issuer: "http://localhost:4200"`

	// Run the resolver
	err := config.NewResolver[OIDCProvider]().
		SetConfigData([]byte(testYamlInput)).
		Resolve(&OIDCProvider{}).
		Verify()

	// Check the error is well an error coming from the parent "Provider" struct
	assert.ErrorContains(t, err, "`slug_id` is mandatory")
}
