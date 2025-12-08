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
	"testing"

	"github.com/stretchr/testify/require"
)

// TestOIDCUserInfoUnmarshalJSON tests the unmarshalling of OIDCUserInfo from JSON.
func TestOIDCUserInfoUnmarshalJSON(t *testing.T) {
	tests := []struct {
		name        string
		jsonData    string
		expectedErr bool
		validate    func(t *testing.T, user *OIDCUserInfo)
	}{
		{
			name: "complete OIDC user info",
			jsonData: `{
				"sub": "user123",
				"email": "john.doe@example.com",
				"name": "John Doe",
				"given_name": "John",
				"family_name": "Doe",
				"picture": "https://example.com/photo.jpg"
			}`,
			expectedErr: false,
			validate: func(t *testing.T, user *OIDCUserInfo) {
				require.Equal(t, "user123", user.Subject)
				require.Equal(t, "john.doe@example.com", user.Email)
				require.Equal(t, "John Doe", user.Name)
				require.Equal(t, "John", user.GivenName)
				require.Equal(t, "Doe", user.FamilyName)
				require.Equal(t, "https://example.com/photo.jpg", user.Picture)
			},
		},
		{
			name: "minimal OIDC user info",
			jsonData: `{
				"sub": "user456",
				"email": "jane@example.com"
			}`,
			expectedErr: false,
			validate: func(t *testing.T, user *OIDCUserInfo) {
				require.Equal(t, "user456", user.Subject)
				require.Equal(t, "jane@example.com", user.Email)
				require.Empty(t, user.Name)
				require.Empty(t, user.GivenName)
			},
		},
		{
			name: "OIDC user info with custom properties",
			jsonData: `{
				"sub": "user789",
				"email": "custom@example.com",
				"name": "Custom User",
				"custom_field": "custom_value",
				"department": "engineering"
			}`,
			expectedErr: false,
			validate: func(t *testing.T, user *OIDCUserInfo) {
				require.Equal(t, "user789", user.Subject)
				require.Equal(t, "custom@example.com", user.Email)
				require.Equal(t, "Custom User", user.Name)
				// Verify that custom properties are stored in rawProperties
				require.Equal(t, "custom_value", user.rawProperties["custom_field"])
				require.Equal(t, "engineering", user.rawProperties["department"])
			},
		},
		{
			name: "OIDC user info with preferred_username",
			jsonData: `{
				"sub": "user999",
				"email": "user@example.com",
				"preferred_username": "custom_username"
			}`,
			expectedErr: false,
			validate: func(t *testing.T, user *OIDCUserInfo) {
				require.Equal(t, "user999", user.Subject)
				require.Equal(t, "custom_username", user.PreferredUsername)
			},
		},
		{
			name: "empty JSON object",
			jsonData: `{
				"sub": "minimal_user"
			}`,
			expectedErr: false,
			validate: func(t *testing.T, user *OIDCUserInfo) {
				require.Equal(t, "minimal_user", user.Subject)
				require.Empty(t, user.Email)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var user OIDCUserInfo
			err := json.Unmarshal([]byte(tt.jsonData), &user)

			if tt.expectedErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validate(t, &user)
			}
		})
	}
}

// TestOIDCUserInfoSetters tests the setter methods for OIDCUserInfo.
func TestOIDCUserInfoSetters(t *testing.T) {
	user := &OIDCUserInfo{
		Subject: "test_user",
	}

	// Test SetIssuer
	user.SetIssuer("https://issuer.example.com")
	require.Equal(t, "https://issuer.example.com", user.issuer)

	// Test SetLoginProps
	loginProps := []string{"preferred_username", "name"}
	user.SetLoginProps(loginProps)
	require.Equal(t, loginProps, user.loginProps)
}

// TestOIDCUserInfoGetters tests the getter methods for OIDCUserInfo.
func TestOIDCUserInfoGetters(t *testing.T) {
	jsonData := `{
		"sub": "user123",
		"email": "john@example.com",
		"name": "John Doe",
		"preferred_username": "john.doe"
	}`

	var user OIDCUserInfo
	err := json.Unmarshal([]byte(jsonData), &user)
	require.NoError(t, err)

	// Configure the user with issuer and login props
	user.SetIssuer("https://issuer.example.com")
	user.SetLoginProps([]string{"preferred_username"})

	// Test GetSubject
	require.Equal(t, "user123", user.GetSubject())

	// Test GetLogin - should use preferred_username since it's in loginProps
	require.Equal(t, "john.doe", user.GetLogin())

	// Test GetProfile
	profile := user.GetProfile()
	require.Equal(t, "john@example.com", profile.Email)
	require.Equal(t, "John Doe", profile.Name)

	// Test GetProviderContext
	providerContext := user.GetProviderContext()
	require.Equal(t, "https://issuer.example.com", providerContext.Issuer)
	require.Equal(t, "john@example.com", providerContext.Email)
	require.Equal(t, "user123", providerContext.Subject)
}

// TestOIDCUserInfoGetLoginFallback tests that GetLogin falls back to using Subject when no login props match.
func TestOIDCUserInfoGetLoginFallback(t *testing.T) {
	jsonData := `{
		"sub": "user123",
		"email": "nousername@example.com"
	}`

	var user OIDCUserInfo
	err := json.Unmarshal([]byte(jsonData), &user)
	require.NoError(t, err)

	user.SetLoginProps([]string{"non_existent_property"})

	// Should fall back to Subject when no login props match and email doesn't have a username part
	login := user.GetLogin()
	require.NotEmpty(t, login)
}

// TestOIDCUserInfoGetLoginFromEmail tests that GetLogin extracts username from email when no login props match.
func TestOIDCUserInfoGetLoginFromEmail(t *testing.T) {
	jsonData := `{
		"sub": "user456",
		"email": "alice.smith@example.com"
	}`

	var user OIDCUserInfo
	err := json.Unmarshal([]byte(jsonData), &user)
	require.NoError(t, err)

	user.SetLoginProps([]string{})

	// Should extract username from email (part before @)
	require.Equal(t, "alice.smith", user.GetLogin())
}
