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

	"github.com/stretchr/testify/assert"
)

func TestAuthProvidersVerify(t *testing.T) {
	wrongOAuth := AuthProviders{OAuth: []OAuthProvider{{SlugID: "hello"}, {SlugID: "hello"}}}
	assert.ErrorContains(t, wrongOAuth.Verify(), "several OAuth providers exist with the same slug_id")

	wrongOIDC := AuthProviders{OIDC: []OIDCProvider{{SlugID: "hello"}, {SlugID: "hello"}}}
	assert.ErrorContains(t, wrongOIDC.Verify(), "several OIDC providers exist with the same slug_id")
}
