// Copyright The Perses Authors
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

package crypto

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashAndSalt(t *testing.T) {
	hash, err := HashAndSalt([]byte("password"))
	require.NoError(t, err)
	assert.True(t, ComparePasswords(string(hash), "password"))
	assert.False(t, ComparePasswords(string(hash), "wrong"))
}

func TestIsValidBcryptHash(t *testing.T) {
	// Generate a real hash and verify it's accepted.
	hash, err := HashAndSalt([]byte("test"))
	require.NoError(t, err)
	assert.True(t, IsValidBcryptHash(string(hash)))

	// Known valid bcrypt hash (cost 10).
	assert.True(t, IsValidBcryptHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"))

	// Invalid inputs.
	assert.False(t, IsValidBcryptHash(""))
	assert.False(t, IsValidBcryptHash("notahash"))
	assert.False(t, IsValidBcryptHash("plaintext-password"))
	assert.False(t, IsValidBcryptHash("$2a$10$tooshort"))
}
