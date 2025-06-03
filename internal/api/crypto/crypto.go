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
)

// based on https://www.golinuxcloud.com/golang-encrypt-decrypt/

type Crypto interface {
	Encrypt(spec *modelV1.SecretSpec) error
	Decrypt(spec *modelV1.SecretSpec) error
}

func New(security config.Security) (Crypto, Security, error) {
	key, err := hex.DecodeString(string(security.EncryptionKey))
	if err != nil {
		return nil, nil, err
	}

	aesBlock, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}
	return &crypto{
			key:   key,
			block: aesBlock,
		},
		GetAuthentication(security, JwtImpl{
			AccessKey:       key,
			refreshKey:      append(key, []byte("-refresh")...),
			accessTokenTTL:  time.Duration(security.Authentication.AccessTokenTTL),
			refreshTokenTTL: time.Duration(security.Authentication.RefreshTokenTTL),
			cookieConfig:    security.Cookie,
			Kubernetes:      security.Authorization.Kubernetes,
		}),
		nil
}

type crypto struct {
	key   []byte
	block cipher.Block
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

func (c *crypto) Decrypt(spec *modelV1.SecretSpec) error {
	basicAuth := spec.BasicAuth
	if basicAuth != nil {
		decryptedPassword, err := c.decrypt(basicAuth.Password)
		if err != nil {
			return err
		}
		basicAuth.Password = decryptedPassword
	}

	authorization := spec.Authorization
	if authorization != nil {
		decryptedCredentials, err := c.decrypt(authorization.Credentials)
		if err != nil {
			return err
		}
		authorization.Credentials = decryptedCredentials
	}

	oauth := spec.OAuth
	if oauth != nil {
		decryptedClientID, err := c.decrypt(oauth.ClientID)
		if err != nil {
			return err
		}
		oauth.ClientID = decryptedClientID

		decryptedClientSecret, err := c.decrypt(oauth.ClientSecret)
		if err != nil {
			return err
		}
		oauth.ClientSecret = decryptedClientSecret
	}

	tlsConfig := spec.TLSConfig
	if tlsConfig != nil {
		decryptedKey, err := c.decrypt(tlsConfig.Key)
		if err != nil {
			return err
		}
		tlsConfig.Key = decryptedKey
	}
	return nil
}

func (c *crypto) encrypt(stringToEncrypt string) (string, error) {
	if len(stringToEncrypt) == 0 {
		return "", nil
	}
	plainText := []byte(stringToEncrypt)
	cipherText := make([]byte, aes.BlockSize+len(plainText))
	iv := cipherText[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	// TODO use AEAD instead of CFB as recommended by Go
	stream := cipher.NewCFBEncrypter(c.block, iv) //nolint: staticcheck
	stream.XORKeyStream(cipherText[aes.BlockSize:], plainText)

	return base64.URLEncoding.EncodeToString(cipherText), nil
}

func (c *crypto) decrypt(stringToDecrypt string) (string, error) {
	if len(stringToDecrypt) == 0 {
		return "", nil
	}
	cipherText, err := base64.URLEncoding.DecodeString(stringToDecrypt)
	if err != nil {
		return "", err
	}
	if len(cipherText) < aes.BlockSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]

	// TODO use AEAD instead of CFB as recommended by Go
	stream := cipher.NewCFBDecrypter(c.block, iv) //nolint: staticcheck

	// XORKeyStream can work in-place if the two arguments are the same.
	stream.XORKeyStream(cipherText, cipherText)

	return string(cipherText), nil
}
