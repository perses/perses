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
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/sirupsen/logrus"
)

const (
	defaultEncryptionKey = "e=dz;`M'5Pjvy^Sq3FVBkTC@N9?H/gua"
)

type SameSite http.SameSite

const (
	SameSiteLaxMode    string = "lax"
	SameSiteStrictMode string = "strict"
	SameSiteNoneMode   string = "none"
)

func ParseSameSite(s string) (SameSite, error) {
	switch s {
	case SameSiteNoneMode:
		return SameSite(http.SameSiteNoneMode), nil
	case "", SameSiteLaxMode:
		return SameSite(http.SameSiteLaxMode), nil
	case SameSiteStrictMode:
		return SameSite(http.SameSiteStrictMode), nil
	default:
		return 0, fmt.Errorf("cookie same_site %q mode not knowm", s)
	}
}

func (s SameSite) String() string {
	switch http.SameSite(s) {
	case http.SameSiteNoneMode:
		return SameSiteNoneMode
	case http.SameSiteLaxMode:
		return SameSiteLaxMode
	case http.SameSiteStrictMode:
		return SameSiteStrictMode
	default:
		return SameSiteLaxMode
	}
}

// MarshalJSON implements the json.Marshaler interface.
func (s SameSite) MarshalJSON() ([]byte, error) {
	return json.Marshal(s.String())
}

// UnmarshalJSON implements the json.Unmarshaler interface.
func (s *SameSite) UnmarshalJSON(bytes []byte) error {
	var str string
	if err := json.Unmarshal(bytes, &str); err != nil {
		return err
	}
	sameSite, err := ParseSameSite(str)
	if err != nil {
		return err
	}
	*s = sameSite
	return nil
}

// MarshalText implements the encoding.TextMarshaler interface.
func (s *SameSite) MarshalText() ([]byte, error) {
	return []byte(s.String()), nil
}

// UnmarshalText implements the encoding.TextUnmarshaler interface.
func (s *SameSite) UnmarshalText(text []byte) error {
	var err error
	*s, err = ParseSameSite(string(text))
	return err
}

// MarshalYAML implements the yaml.Marshaler interface.
func (s SameSite) MarshalYAML() (interface{}, error) {
	return s.String(), nil
}

// UnmarshalYAML implements the yaml.Unmarshaler interface.
func (s *SameSite) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var str string
	if err := unmarshal(&str); err != nil {
		return err
	}
	sameSite, err := ParseSameSite(str)
	if err != nil {
		return err
	}
	*s = sameSite
	return nil
}

func (s *SameSite) Verify() error {
	if *s == 0 {
		*s = SameSite(http.SameSiteLaxMode)
	}
	return nil
}

type Cookie struct {
	// Set the SameSite cookie attribute and prevents the browser from sending the cookie along with cross-site requests.
	// The main goal is to mitigate the risk of cross-origin information leakage.
	// This setting also provides some protection against cross-site request forgery attacks (CSRF)
	SameSite SameSite `json:"same_site,omitempty" yaml:"same_site,omitempty"`
	// Set to true if you host Perses behind HTTPS. Default is false
	Secure bool `json:"secure" yaml:"secure"`
}

type CORSConfig struct {
	Enable           bool     `json:"enable" yaml:"enable"`
	AllowOrigins     []string `json:"allow_origins,omitempty" yaml:"allow_origins,omitempty"`
	AllowMethods     []string `json:"allow_methods,omitempty" yaml:"allow_methods,omitempty"`
	AllowHeaders     []string `json:"allow_headers,omitempty" yaml:"allow_headers,omitempty"`
	AllowCredentials bool     `json:"allow_credentials,omitempty" yaml:"allow_credentials,omitempty"`
	ExposeHeaders    []string `json:"expose_headers,omitempty" yaml:"expose_headers,omitempty"`
	MaxAge           int      `json:"max_age,omitempty" yaml:"max_age,omitempty"`
}

type Security struct {
	// Readonly will deactivate any HTTP POST, PUT, DELETE endpoint
	Readonly bool `json:"readonly" yaml:"readonly"`
	// Cookie configuration
	Cookie Cookie `json:"cookie" yaml:"cookie"`
	// EncryptionKey is the secret key used to encrypt and decrypt sensitive data
	// stored in the database such as the password of the basic auth for a datasource.
	// Note that if it is not provided, it will use a default value.
	// On a production instance, you should set this key.
	// Also note the key size must be exactly 32 bytes long as we are using AES-256 to encrypt the data.
	EncryptionKey secret.Hidden `json:"encryption_key,omitempty" yaml:"encryption_key,omitempty"`
	// EncryptionKeyFile is the path to file containing the secret key
	EncryptionKeyFile string `json:"encryption_key_file,omitempty" yaml:"encryption_key_file,omitempty"`
	// When it is true, the authentication and authorization config are considered.
	// And you will need a valid JWT token to contact most of the endpoints exposed by the API
	EnableAuth bool `json:"enable_auth" yaml:"enable_auth"`
	// Authorization contains all configs around rbac (permissions and roles)
	Authorization AuthorizationConfig `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// Authentication contains configuration regarding management of access/refresh token
	Authentication AuthenticationConfig `json:"authentication,omitempty" yaml:"authentication,omitempty"`
	// Configuration for the CORS middleware.
	CORS CORSConfig `json:"cors,omitempty" yaml:"cors"`
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
		s.EncryptionKey = secret.Hidden(data)
	}
	if len(s.EncryptionKey) != 32 {
		return fmt.Errorf("encryption_key size must be 32 bytes")
	}
	s.EncryptionKey = secret.Hidden(hex.EncodeToString([]byte(s.EncryptionKey)))

	if s.EnableAuth && !s.Authentication.Providers.EnableNative &&
		len(s.Authentication.Providers.OIDC) == 0 &&
		len(s.Authentication.Providers.OAuth) == 0 {
		return errors.New("impossible to enable auth if no authentication provider is setup")
	}

	if !s.EnableAuth && s.Authorization.Providers.Kubernetes.Enable {
		return errors.New("authorization provider cannot be setup without auth enabled")
	}

	return nil
}
