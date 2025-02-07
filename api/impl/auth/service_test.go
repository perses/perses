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
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestSaveProviderInfo(t *testing.T) {
	uInfoA := oidcUserInfo{
		externalUserInfoProfile: externalUserInfoProfile{
			Email: "email",
		},
		Subject: "subject",
		issuer:  "issuer",
	}

	uInfoB := oidcUserInfo{
		externalUserInfoProfile: externalUserInfoProfile{
			Email: "differentEmail",
		},
		Subject: "subject",
		issuer:  "issuer",
	}

	initialSpec := v1.UserSpec{
		FirstName:      "",
		LastName:       "",
		NativeProvider: v1.NativeProvider{},
		OauthProviders: nil,
	}

	// Save a first time the provider (has changed, no error expected)
	result1, changed1, err1 := saveProviderInfo(initialSpec, uInfoA.GetProviderContext())
	assert.Equal(t, []v1.OAuthProvider{uInfoA.GetProviderContext()}, result1.OauthProviders)
	assert.True(t, changed1)
	assert.NoError(t, err1)

	// Save a second time the same provider (has not changed, no error expected)
	result2, changed2, err2 := saveProviderInfo(result1, uInfoA.GetProviderContext())
	assert.Equal(t, []v1.OAuthProvider{uInfoA.GetProviderContext()}, result2.OauthProviders)
	assert.False(t, changed2)
	assert.NoError(t, err2)

	// Save a different provider (has not changed, error expected)
	result3, changed3, err3 := saveProviderInfo(result2, uInfoB.GetProviderContext())
	assert.Equal(t, []v1.OAuthProvider{uInfoA.GetProviderContext()}, result3.OauthProviders)
	assert.False(t, changed3)
	assert.Error(t, err3)
}
