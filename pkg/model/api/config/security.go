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
	"encoding/hex"
	"fmt"
	"os"
	"time"

	promConfig "github.com/prometheus/common/config"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

const (
	defaultEncryptionKey   = "e=dz;`M'5Pjvy^Sq3FVBkTC@N9?H/gua"
	DefaultAccessTokenTTL  = time.Minute * 15
	DefaultRefreshTokenTTL = time.Hour * 24
)

type AuthenticationConfig struct {
	// AccessTokenTTL is the time to live of the access token. By default, it is 15 minutes.
	AccessTokenTTL model.Duration `json:"access_token_ttl,omitempty" yaml:"access_token_ttl,omitempty"`
	// RefreshTokenTTL is the time to live of the refresh token.
	// The refresh token is used to get a new access token when it is expired.
	// By default, it is 24 hours.
	RefreshTokenTTL model.Duration `json:"refresh_token_ttl,omitempty" yaml:"refresh_token_ttl,omitempty"`
	// DisableSignUp deactivates the Sign-up page in the UI.
	// It also disables the endpoint that gives the possibility to create a user.
	DisableSignUp bool `json:"disable_sign_up" yaml:"disable_sign_up"`
}

func (a *AuthenticationConfig) Verify() error {
	if a.AccessTokenTTL == 0 {
		a.AccessTokenTTL = model.Duration(DefaultAccessTokenTTL)
	}
	if a.RefreshTokenTTL == 0 {
		a.RefreshTokenTTL = model.Duration(DefaultRefreshTokenTTL)
	}
	return nil
}

type Security struct {
	// Readonly will deactivate any HTTP POST, PUT, DELETE endpoint
	Readonly bool `json:"readonly" yaml:"readonly"`
	// EncryptionKey is the secret key used to encrypt and decrypt sensitive data
	// stored in the database such as the password of the basic auth for a datasource.
	// Note that if it is not provided, it will use a default value.
	// When Perses is used in a multi instance mode, you should provide the key.
	// Otherwise, each instance will have a different key and therefore won't be able to decrypt what the other is encrypting.
	// Also note the key must be at least 32 bytes long.
	EncryptionKey promConfig.Secret `json:"encryption_key,omitempty" yaml:"encryption_key,omitempty"`
	// EncryptionKeyFile is the path to file containing the secret key
	EncryptionKeyFile string `json:"encryption_key_file,omitempty" yaml:"encryption_key_file,omitempty"`
	// When it is true, the authentication and authorization config are considered.
	// And you will need a valid JWT token to contact most of the endpoints exposed by the API
	EnableAuth bool `json:"enable_auth" yaml:"enable_auth"`
	// Authorization contains all configs around rbac (permissions and roles)
	Authorization AuthorizationConfig `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// Authentication contains configuration regarding the time to live of the access/refresh token
	Authentication AuthenticationConfig `json:"authentication,omitempty" yaml:"authentication,omitempty"`
}

func (s *Security) Verify() error {
	if len(s.EncryptionKey) == 0 && len(s.EncryptionKeyFile) == 0 {
		logrus.Warning("encryption_key is not provided and therefore it will use a default one. For production instance you should provide the key.")
		s.EncryptionKey = defaultEncryptionKey
	}
	if len(s.EncryptionKey) > 0 && len(s.EncryptionKeyFile) > 0 {
		return fmt.Errorf("encryption_key and encryption_key_file are mutually exclusive. Use one or the other not both at the same time")
	}
	if len(s.EncryptionKeyFile) > 0 {
		// Read the file and load the password contained
		data, err := os.ReadFile(s.EncryptionKeyFile)
		if err != nil {
			return err
		}
		s.EncryptionKey = promConfig.Secret(data)
	}
	if len(s.EncryptionKey) < 32 {
		return fmt.Errorf("encryption_key must be longer than 32 bytes")
	}
	s.EncryptionKey = promConfig.Secret(hex.EncodeToString([]byte(s.EncryptionKey)))
	return nil
}
