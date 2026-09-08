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

package user

import (
	"testing"

	"github.com/perses/perses/internal/api/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolvePassword_Plaintext(t *testing.T) {
	result, err := resolvePassword("mypassword", "", "alice")
	require.NoError(t, err)
	// The result should be a valid bcrypt hash.
	assert.True(t, crypto.IsValidBcryptHash(result))
	// The hash should verify against the original password.
	assert.True(t, crypto.ComparePasswords(result, "mypassword"))
}

func TestResolvePassword_PreHashedBcrypt(t *testing.T) {
	// Pre-compute a bcrypt hash.
	hash, err := crypto.HashAndSalt([]byte("secretpassword"))
	require.NoError(t, err)

	result, err := resolvePassword("", string(hash), "bob")
	require.NoError(t, err)
	// The hash should be stored as-is (no re-hashing).
	assert.Equal(t, string(hash), result)
	// And it should still verify against the original password.
	assert.True(t, crypto.ComparePasswords(result, "secretpassword"))
}

func TestResolvePassword_InvalidBcryptHash(t *testing.T) {
	_, err := resolvePassword("", "not-a-bcrypt-hash", "charlie")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not a valid bcrypt hash")
}

func TestResolvePassword_BothEmpty(t *testing.T) {
	_, err := resolvePassword("", "", "dave")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "password or passwordHash must be provided")
}
