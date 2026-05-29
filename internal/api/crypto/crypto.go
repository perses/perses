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
	"fmt"
	"io"
	"time"

	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

// TODO(celian-garcia): follow the plan described in the following issue to migrate old encryption to new encryption,
//  maximizing backward compatibility: https://github.com/perses/perses/issues/2901
//  ==========================================================
// 	s0 (based on https://www.golinuxcloud.com/golang-encrypt-decrypt/)
// 	- encrypt in BAD
// 	- decrypt in BAD
// 	*s1 (*current situation)
// 	- encrypt in BAD
// 	- decrypt in GOOD or BAD
// 	s2
// 	- encrypt in GOOD
//  - decrypt in GOOD or BAD (+reencrypt script on start)
// 	s3
// 	- encrypt in GOOD
//  - decrypt in GOOD
//  ==========================================================

type Crypto interface {
	Encrypt(spec *modelV1.SecretSpec) error
	// Decrypt decrypts the spec fields in place.
	// Returns true if the data was encrypted with the old format and needs re-encryption.
	Decrypt(spec *modelV1.SecretSpec) (bool, error)
}

func New(security config.Security) (Crypto, JWT, error) {
	key, err := hex.DecodeString(string(security.EncryptionKey))
	if err != nil {
		return nil, nil, err
	}

	aesBlock, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}
	return &crypto{
			usingAuthenticatedEncryption: false,
			key:                          key,
			block:                        aesBlock,
		},
		&jwtImpl{
			accessKey:       key,
			refreshKey:      append(key, []byte("-refresh")...),
			accessTokenTTL:  time.Duration(security.Authentication.AccessTokenTTL),
			refreshTokenTTL: time.Duration(security.Authentication.RefreshTokenTTL),
			cookieConfig:    security.Cookie,
		}, nil
}

// crypto is an implementation of the encrypt / decrypt interface that allows the user to decide which algorithm to be
// used for encryption. For decryption, it will use both for compatibility.
type crypto struct {
	// usingAuthenticatedEncryption allow you to choose between:
	// - authenticated algorithm (AEAD): we use here GCM (Galois/Counter Mode)
	// - unauthenticated algorithm: we use here CFB (Cipher Feedback)
	// === /!\ Beware to not play too much with that to avoid backward incompatibility. /!\ ===
	// === /!\ This is mainly used internally in a migration process of several months. /!\ ===
	usingAuthenticatedEncryption bool
	key                          []byte
	block                        cipher.Block
}

func (c *crypto) Encrypt(spec *modelV1.SecretSpec) error {
	basicAuth := spec.BasicAuth
	if basicAuth != nil {
		encryptedPassword, err := c.encrypt(basicAuth.Password)
		if err != nil {
			return err
		}
		basicAuth.Password = encryptedPassword
	}

	authorization := spec.Authorization
	if authorization != nil {
		encryptedCredentials, err := c.encrypt(authorization.Credentials)
		if err != nil {
			return err
		}
		authorization.Credentials = encryptedCredentials
	}
	oauth := spec.OAuth
	if oauth != nil {
		encryptedClientID, err := c.encrypt(oauth.ClientID)
		if err != nil {
			return err
		}
		oauth.ClientID = encryptedClientID

		encryptedClientSecret, err := c.encrypt(oauth.ClientSecret)
		if err != nil {
			return err
		}
		oauth.ClientSecret = encryptedClientSecret
	}

	tlsConfig := spec.TLSConfig
	if tlsConfig != nil {
		encryptedKey, err := c.encrypt(tlsConfig.Key)
		if err != nil {
			return err
		}
		tlsConfig.Key = encryptedKey
	}
	return nil
}

func (c *crypto) Decrypt(spec *modelV1.SecretSpec) (bool, error) {
	needsReEncryption := false

	if spec.BasicAuth != nil {
		decrypted, legacy, err := c.decrypt(spec.BasicAuth.Password)
		if err != nil {
			return false, err
		}
		spec.BasicAuth.Password = decrypted
		needsReEncryption = needsReEncryption || legacy
	}

	if spec.Authorization != nil {
		decrypted, legacy, err := c.decrypt(spec.Authorization.Credentials)
		if err != nil {
			return false, err
		}
		spec.Authorization.Credentials = decrypted
		needsReEncryption = needsReEncryption || legacy
	}

	if spec.OAuth != nil {
		decrypted, legacy, err := c.decrypt(spec.OAuth.ClientID)
		if err != nil {
			return false, err
		}
		spec.OAuth.ClientID = decrypted
		needsReEncryption = needsReEncryption || legacy

		decrypted, legacy, err = c.decrypt(spec.OAuth.ClientSecret)
		if err != nil {
			return false, err
		}
		spec.OAuth.ClientSecret = decrypted
		needsReEncryption = needsReEncryption || legacy
	}

	if spec.TLSConfig != nil {
		decrypted, legacy, err := c.decrypt(spec.TLSConfig.Key)
		if err != nil {
			return false, err
		}
		spec.TLSConfig.Key = decrypted
		needsReEncryption = needsReEncryption || legacy
	}

	return needsReEncryption, nil
}

func (c *crypto) encryptGCM(stringToEncrypt string) (string, error) {
	gcm, err := cipher.NewGCM(c.block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	cipherText := gcm.Seal(nonce, nonce, []byte(stringToEncrypt), nil)
	return base64.URLEncoding.EncodeToString(cipherText), nil
}

func (c *crypto) encryptCFB(stringToEncrypt string) (string, error) {
	plainText := []byte(stringToEncrypt)
	cipherText := make([]byte, aes.BlockSize+len(plainText))
	iv := cipherText[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	stream := cipher.NewCFBEncrypter(c.block, iv) //nolint: staticcheck
	stream.XORKeyStream(cipherText[aes.BlockSize:], plainText)

	return base64.URLEncoding.EncodeToString(cipherText), nil
}

// encrypt uses AES-GCM (AEAD) or old CFB format to encrypt the string.
// The returned string is base64 encoded and contains the nonce as prefix.
func (c *crypto) encrypt(stringToEncrypt string) (string, error) {
	if len(stringToEncrypt) == 0 {
		return "", nil
	}

	if c.usingAuthenticatedEncryption {
		return c.encryptGCM(stringToEncrypt)
	}
	return c.encryptCFB(stringToEncrypt)
}

func (c *crypto) decryptGCM(cipherText []byte) (string, error) {
	gcm, err := cipher.NewGCM(c.block)
	if err != nil {
		return "", err
	}

	if len(cipherText) >= gcm.NonceSize() {
		nonce := cipherText[:gcm.NonceSize()]
		plainText, err := gcm.Open(nil, nonce, cipherText[gcm.NonceSize():], nil)
		if err == nil {
			return string(plainText), nil
		}
	}
	return "", nil
}

func (c *crypto) decryptCFB(cipherText []byte) (string, error) {
	if len(cipherText) < aes.BlockSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]

	stream := cipher.NewCFBDecrypter(c.block, iv) //nolint: staticcheck

	// XORKeyStream can work in-place if the two arguments are the same.
	stream.XORKeyStream(cipherText, cipherText)

	return string(cipherText), nil
}

// decrypt tries AES-GCM (AEAD) first. If it fails, it falls back to the old CFB format.
// Returns (plaintext, needsReEncryption, error).
func (c *crypto) decrypt(stringToDecrypt string) (string, bool, error) {
	if len(stringToDecrypt) == 0 {
		return "", false, nil
	}

	cipherText, decodeErr := base64.URLEncoding.DecodeString(stringToDecrypt)
	if decodeErr != nil {
		return "", false, decodeErr
	}

	// Try GCM first
	plaintext, err := c.decryptGCM(cipherText)
	if err != nil {
		return plaintext, false, err
	}
	if len(plaintext) > 0 {
		return plaintext, false, nil
	}

	logrus.Debugf("Failed to decrypt with GCM (old format), falling back to CFB (new authenticated format)")

	// Fallback to old CFB format
	plaintext, err = c.decryptCFB(cipherText)
	// If decryption is successful with the old format, we need to re-encrypt it with the new format.
	// But only if the encryption with new format is enabled.
	needsReEncryption := c.usingAuthenticatedEncryption && err == nil
	return plaintext, needsReEncryption, err
}
