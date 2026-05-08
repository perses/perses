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
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"testing"

	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func authLabel(authenticated bool) string {
	if authenticated {
		return "authenticated"
	}
	return "unauthenticated"
}

func generateTestKey() []byte {
	keyHex := "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		panic(err)
	}
	return key
}

func createTestCrypto(t *testing.T, authenticated bool) *crypto {
	key := generateTestKey()
	block, err := aes.NewCipher(key)
	require.NoError(t, err)
	return &crypto{
		usingAuthenticatedEncryption: authenticated,
		key:                          key,
		block:                        block,
	}
}

func TestEncryptDecrypt_RoundTrip(t *testing.T) {
	testCases := []string{
		"",
		"a",
		"mysecretpassword",
		"complex!@#$%^&*()password",
		"multiline\npassword",
		"unicode_パスワード",
	}

	for _, authenticated := range []bool{true, false} {
		t.Run(authLabel(authenticated), func(t *testing.T) {
			c := createTestCrypto(t, authenticated)
			for _, plaintext := range testCases {
				t.Run(plaintext, func(t *testing.T) {
					encrypted, err := c.encrypt(plaintext)
					require.NoError(t, err)

					decrypted, needsReEncryption, err := c.decrypt(encrypted)
					require.NoError(t, err)
					assert.Equal(t, plaintext, decrypted)
					assert.False(t, needsReEncryption)
				})
			}
		})
	}
}

func TestEncryptDecrypt_DifferentEncryptions(t *testing.T) {
	for _, authenticated := range []bool{true, false} {
		t.Run(authLabel(authenticated), func(t *testing.T) {
			c := createTestCrypto(t, authenticated)
			plaintext := "samepassword"

			encrypted1, err := c.encrypt(plaintext)
			require.NoError(t, err)

			encrypted2, err := c.encrypt(plaintext)
			require.NoError(t, err)

			// Due to random nonce, two encryptions of the same plaintext should differ
			assert.NotEqual(t, encrypted1, encrypted2)

			decrypted1, _, err := c.decrypt(encrypted1)
			require.NoError(t, err)
			decrypted2, _, err := c.decrypt(encrypted2)
			require.NoError(t, err)
			assert.Equal(t, plaintext, decrypted1)
			assert.Equal(t, plaintext, decrypted2)
		})
	}
}

func TestEncryptDecryptSpec(t *testing.T) {
	for _, authenticated := range []bool{true, false} {
		t.Run(authLabel(authenticated), func(t *testing.T) {
			c := createTestCrypto(t, authenticated)
			spec := &modelV1.SecretSpec{
				BasicAuth: &secret.BasicAuth{
					Username: "user",
					Password: "pass123",
				},
				Authorization: &secret.Authorization{
					Credentials: "Bearer token",
				},
				OAuth: &secret.OAuth{
					ClientID:     "client123",
					ClientSecret: "secret123",
				},
			}

			originalPassword := spec.BasicAuth.Password
			originalCredentials := spec.Authorization.Credentials
			originalClientID := spec.OAuth.ClientID
			originalClientSecret := spec.OAuth.ClientSecret

			err := c.Encrypt(spec)
			require.NoError(t, err)
			assert.NotEqual(t, originalPassword, spec.BasicAuth.Password)
			assert.NotEqual(t, originalCredentials, spec.Authorization.Credentials)
			assert.NotEqual(t, originalClientID, spec.OAuth.ClientID)
			assert.NotEqual(t, originalClientSecret, spec.OAuth.ClientSecret)

			needsReEncryption, err := c.Decrypt(spec)
			require.NoError(t, err)
			assert.False(t, needsReEncryption)
			assert.Equal(t, originalPassword, spec.BasicAuth.Password)
			assert.Equal(t, originalCredentials, spec.Authorization.Credentials)
			assert.Equal(t, originalClientID, spec.OAuth.ClientID)
			assert.Equal(t, originalClientSecret, spec.OAuth.ClientSecret)
		})
	}
}

func TestEncryptDecryptSpec_NilFields(t *testing.T) {
	for _, authenticated := range []bool{true, false} {
		t.Run(authLabel(authenticated), func(t *testing.T) {
			c := createTestCrypto(t, authenticated)
			spec := &modelV1.SecretSpec{}

			err := c.Encrypt(spec)
			require.NoError(t, err)

			needsReEncryption, err := c.Decrypt(spec)
			require.NoError(t, err)
			assert.False(t, needsReEncryption)
		})
	}
}

func TestDecrypt_InvalidInputs(t *testing.T) {
	for _, authenticated := range []bool{true, false} {
		t.Run(authLabel(authenticated), func(t *testing.T) {
			c := createTestCrypto(t, authenticated)

			_, _, err := c.decrypt("!!!invalid base64!!!")
			assert.Error(t, err)

			_, _, err = c.decrypt("YQ==") // too short
			assert.Error(t, err)
		})
	}
}

func TestBackwardCompatibility_CFBToGCM(t *testing.T) {
	c := createTestCrypto(t, true)
	plaintext := "mysecretpassword"

	// Encrypt with old CFB format
	cfbCiphertext := encryptCFB(c, plaintext)

	// Decrypt should work and flag for re-encryption
	decrypted, needsReEncryption, err := c.decrypt(cfbCiphertext)
	require.NoError(t, err)
	assert.Equal(t, plaintext, decrypted)
	assert.True(t, needsReEncryption)

	// Now encrypt with new GCM format
	gcmCiphertext, err := c.encrypt(plaintext)
	require.NoError(t, err)

	// Should not need re-encryption
	decrypted, needsReEncryption, err = c.decrypt(gcmCiphertext)
	require.NoError(t, err)
	assert.Equal(t, plaintext, decrypted)
	assert.False(t, needsReEncryption)
}

// encryptCFB simulates the old CFB encryption for backward compatibility tests.
func encryptCFB(c *crypto, plaintext string) string {
	plainTextBytes := []byte(plaintext)
	cipherText := make([]byte, aes.BlockSize+len(plainTextBytes))
	iv := cipherText[:aes.BlockSize]
	_, _ = rand.Reader.Read(iv)

	stream := cipher.NewCFBEncrypter(c.block, iv) //nolint: staticcheck
	stream.XORKeyStream(cipherText[aes.BlockSize:], plainTextBytes)

	return base64.URLEncoding.EncodeToString(cipherText)
}
