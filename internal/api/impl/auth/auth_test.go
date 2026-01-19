// Copyright 2024 The Perses Authors
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

package auth

import (
	"net/http"
	"net/url"
	"testing"

	"github.com/perses/perses/internal/api/utils"
	"github.com/stretchr/testify/assert"
)

func TestGetRedirectURI_WithAPIPrefix(t *testing.T) {
	cases := []struct {
		title     string
		apiPrefix string
		want      string
	}{
		{"empty prefix", "", "http://localhost:8080/api/auth/providers/oidc/azure/callback"},
		{"perses", "perses", "http://localhost:8080/perses/api/auth/providers/oidc/azure/callback"},
		{"/perses", "/perses", "http://localhost:8080/perses/api/auth/providers/oidc/azure/callback"},
		// Double slashes are not removed, but it's ok as the apiPrefix supposed to be used as is.
		{"perses/", "perses/", "http://localhost:8080/perses//api/auth/providers/oidc/azure/callback"},
	}
	for _, tc := range cases {
		t.Run(tc.title, func(t *testing.T) {
			got := getRedirectURI(&http.Request{
				URL: &url.URL{
					Scheme: "http",
				},
				Host: "localhost:8080",
			}, utils.AuthnKindOIDC, "azure", tc.apiPrefix)
			assert.Equal(t, tc.want, got)
		})
	}
}

// Test for encodeOAuthState: ensures the state is correctly formatted and contains the redirect path.
func TestEncodeOAuthState(t *testing.T) {
	redirect := "/dashboard"
	state := encodeOAuthState(redirect)
	assert.Contains(t, state, "--/dashboard")
	assert.Len(t, state, 16+2+10)
}

// Test for decodeOAuthState: ensures correct extraction and empty string for invalid formats.
func TestDecodeOAuthState(t *testing.T) {
	redirect := "/dashboard"
	state := "1234567890abcdef--" + redirect
	assert.Equal(t, redirect, decodeOAuthState(state))

	state = "invalidformat"
	assert.Equal(t, "", decodeOAuthState(state))

	state = "short--"
	assert.Equal(t, "", decodeOAuthState(state))
}
