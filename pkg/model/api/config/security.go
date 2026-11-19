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

package config

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/sirupsen/logrus"
)

const (
	defaultEncryptionKey = "e=dz;`M'5Pjvy^Sq3FVBkTC@N9?H/gua"
	// DefaultContentSecurityPolicy is the Content-Security-Policy sent with the pages of the UI when no policy is
	// configured:
	//   - script-src 'self' 'unsafe-eval': only the scripts served by Perses (the UI and the plugins) can run.
	//     It blocks the inline scripts, the inline event handlers and the javascript: URLs, which is how a script
	//     injected in the content of a dashboard would run. 'unsafe-eval' is allowed as the module federation runtime,
	//     which loads the plugins, relies on it.
	//   - object-src 'none': no <object> or <embed> element can load content.
	//   - base-uri 'self': a <base> element can only use a URL of the Perses origin, so it can't make the relative URLs
	//     point to another website.
	DefaultContentSecurityPolicy = "script-src 'self' 'unsafe-eval'; object-src 'none'; base-uri 'self'"
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
		return 0, fmt.Errorf("cookie same_site %q mode not known", s)
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
func (s SameSite) MarshalYAML() (any, error) {
	return s.String(), nil
}

// UnmarshalYAML implements the yaml.Unmarshaler interface.
func (s *SameSite) UnmarshalYAML(unmarshal func(any) error) error {
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

func (c *CORSConfig) Verify() error {
	if !c.Enable {
		return nil
	}
	if len(c.AllowOrigins) == 0 {
		// Every origin is allowed by default.
		c.AllowOrigins = []string{"*"}
	}
	if c.AllowCredentials {
		// The entries are checked in order, so every origin receives 'Access-Control-Allow-Origin: *' when '*' comes first.
		if c.AllowOrigins[0] == "*" {
			return errors.New("security.cors.allow_credentials cannot be true when the first entry of security.cors.allow_origins is '*' (its default value is [\"*\"]): " +
				"every origin then receives the response header 'Access-Control-Allow-Origin: *', which the browsers reject for the requests with credentials. " +
				"Set security.cors.allow_origins to the list of the allowed origins instead")
		}
		if slices.Contains(c.AllowOrigins, "*") {
			// TODO: return an error instead in v0.58.0, like echo v5 does natively, see https://github.com/perses/perses/issues/4721
			logrus.Warn("security.cors.allow_origins contains '*' while security.cors.allow_credentials is true: the origins not matched by an entry before '*' " +
				"receive the response header 'Access-Control-Allow-Origin: *', which the browsers reject for the requests with credentials. " +
				"This configuration is deprecated and will be rejected in v0.58.0. Remove '*' from security.cors.allow_origins, or set security.cors.allow_credentials to false. " +
				"See https://github.com/perses/perses/issues/4721")
		}
	}
	for _, origin := range c.AllowOrigins {
		if IsCORSOriginPattern(origin) {
			// TODO: return an error instead in v0.58.0, see https://github.com/perses/perses/issues/4721
			logrus.Warnf("the entry %q of security.cors.allow_origins is a wildcard pattern. The wildcard patterns are deprecated and will be removed in v0.58.0. "+
				"List the exact origins instead. See https://github.com/perses/perses/issues/4721", origin)
		}
	}
	return nil
}

// IsCORSOriginPattern tells if the given allowed origin is a wildcard pattern,
// where '*' matches 0 or more characters and '?' matches exactly 1 character.
// The value '*' alone is not a pattern: it allows every origin.
func IsCORSOriginPattern(origin string) bool {
	return origin != "*" && strings.ContainsAny(origin, "*?")
}

// ContentSecurityPolicy is the configuration of the Content-Security-Policy header sent with the pages of the UI.
// The header restricts what the browser is allowed to run in the Perses origin, as a second layer of protection
// against a script injected in the content of a dashboard.
type ContentSecurityPolicy struct {
	// Disable stops sending the Content-Security-Policy header with the pages of the UI.
	Disable bool `json:"disable" yaml:"disable"`
	// Policy is the value of the Content-Security-Policy header. When empty, DefaultContentSecurityPolicy is used.
	// The policy can be written on several lines: consecutive whitespaces, including newlines, are replaced by a single
	// space.
	Policy string `json:"policy,omitempty" yaml:"policy,omitempty"`
}

func (c *ContentSecurityPolicy) Verify() error {
	if c.Disable {
		return nil
	}
	// A header value can't contain a newline, and the whitespaces are not significant in a policy.
	c.Policy = strings.Join(strings.Fields(c.Policy), " ")
	if len(c.Policy) == 0 {
		c.Policy = DefaultContentSecurityPolicy
	}
	return nil
}

type Security struct {
	// Readonly will deactivate any HTTP POST, PUT, DELETE endpoint
	Readonly bool `json:"readonly" yaml:"readonly"`
	// Cookie configuration
	Cookie Cookie `json:"cookie" yaml:"cookie"`
	// EncryptionKey is the secret key used to encrypt and decrypt sensitive data
	// stored in the database such as the password of the basic auth for a datasource.
	// In case authentication is enabled, it is also used to encrypt the access and refresh token used for authentication.
	// Therefore, if auth is enabled, and you did not set this key, Perses will not start and will return an error.
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
	// ContentSecurityPolicy is the configuration of the Content-Security-Policy header sent with the pages of the UI.
	ContentSecurityPolicy ContentSecurityPolicy `json:"content_security_policy" yaml:"content_security_policy"`
	// SecretFileAllowedDirectories is the list of absolute directories from which the Secrets and GlobalSecrets
	// are allowed to read files (basicAuth.passwordFile, authorization.credentialsFile, oauth.clientSecretFile,
	// tlsConfig.caFile/certFile/keyFile).
	// When empty (default), any file reference in a Secret or a GlobalSecret is rejected.
	// This prevents a user allowed to create a secret from exfiltrating arbitrary files from the server.
	SecretFileAllowedDirectories []string `json:"secret_file_allowed_directories,omitempty" yaml:"secret_file_allowed_directories,omitempty"`
}

func (s *Security) Verify() error {
	if len(s.EncryptionKey) == 0 && len(s.EncryptionKeyFile) == 0 {
		if s.EnableAuth {
			return fmt.Errorf("encryption_key or encryption_key_file must be provided when auth is enabled")
		}
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
		return fmt.Errorf("encryption_key size must be 32 bytes, got %d bytes", len(s.EncryptionKey))
	}
	s.EncryptionKey = secret.Hidden(hex.EncodeToString([]byte(s.EncryptionKey)))

	if s.EnableAuth && !s.Authentication.Providers.EnableNative &&
		len(s.Authentication.Providers.OIDC) == 0 &&
		len(s.Authentication.Providers.OAuth) == 0 &&
		!s.Authentication.Providers.KubernetesProvider.Enable {
		return errors.New("impossible to enable auth if no authentication provider is setup")
	}

	if s.EnableAuth && !s.Authorization.Provider.Kubernetes.Enable {
		s.Authorization.Provider.Native.Enable = true
	}

	if !s.EnableAuth && (s.Authorization.Provider.Native.Enable || s.Authorization.Provider.Kubernetes.Enable) {
		return errors.New("authorization provider cannot be setup without auth enabled")
	}

	if (s.Authorization.Provider.Kubernetes.Enable && !s.Authentication.Providers.KubernetesProvider.Enable) || (!s.Authorization.Provider.Kubernetes.Enable && s.Authentication.Providers.KubernetesProvider.Enable) {
		return errors.New("kubernetes authorization and authentication providers must be enabled at the same time")
	}

	for i, dir := range s.SecretFileAllowedDirectories {
		if !filepath.IsAbs(dir) {
			return fmt.Errorf("secret_file_allowed_directories: %q must be an absolute path", dir)
		}
		cleaned := filepath.Clean(dir)
		if cleaned == string(filepath.Separator) {
			return errors.New("secret_file_allowed_directories: the root directory is not allowed")
		}
		s.SecretFileAllowedDirectories[i] = cleaned
	}

	return nil
}
