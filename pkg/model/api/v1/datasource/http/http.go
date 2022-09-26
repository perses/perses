// Copyright 2021 The Perses Authors
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

package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

type AllowedEndpoint struct {
	EndpointPattern common.Regexp `json:"endpoint_pattern" yaml:"endpoint_pattern"`
	Method          string        `json:"method" yaml:"method"`
}

func (h *AllowedEndpoint) UnmarshalJSON(data []byte) error {
	var tmp AllowedEndpoint
	type plain AllowedEndpoint
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *AllowedEndpoint) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp AllowedEndpoint
	type plain AllowedEndpoint
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *AllowedEndpoint) validate() error {
	if len(h.Method) == 0 {
		return fmt.Errorf("HTTP method cannot be empty")
	}
	if h.EndpointPattern.Regexp == nil {
		return fmt.Errorf("HTTP endpoint pattern cannot be empty")
	}
	if h.Method != http.MethodGet &&
		h.Method != http.MethodPost &&
		h.Method != http.MethodDelete &&
		h.Method != http.MethodPut &&
		h.Method != http.MethodPatch {
		return fmt.Errorf("%q is not a valid http method. Current supported HTTP method: %s, %s, %s, %s, %s", h.Method, http.MethodGet, http.MethodPost, http.MethodDelete, http.MethodPut, http.MethodPatch)
	}
	return nil
}

type BasicAuth struct {
	Username string `json:"username" yaml:"username"`
	Password string `json:"password" yaml:"password,omitempty"`
	// PasswordFile is a path to a file that contains a password
	PasswordFile string `json:"password_file" yaml:"password_file,omitempty"`
}

func (b *BasicAuth) UnmarshalJSON(data []byte) error {
	var tmp BasicAuth
	type plain BasicAuth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *BasicAuth) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp BasicAuth
	type plain BasicAuth
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *BasicAuth) GetPassword() (string, error) {
	if len(b.PasswordFile) > 0 {
		data, err := os.ReadFile(b.PasswordFile)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}
	return b.Password, nil
}

func (b *BasicAuth) validate() error {
	if len(b.Username) == 0 || (len(b.Password) == 0 && len(b.PasswordFile) == 0) {
		return fmt.Errorf("when using basic_auth, username and password/password_file cannot be empty")
	}
	if len(b.PasswordFile) > 0 {
		// Read the file to verify it exists
		_, err := os.ReadFile(b.PasswordFile)
		if err != nil {
			return err
		}
	}
	return nil
}

type Auth struct {
	InsecureTLS bool       `json:"insecure_tls,omitempty" yaml:"insecure_tls,omitempty"`
	BearerToken string     `json:"bearer_token,omitempty" yaml:"bearer_token,omitempty"`
	BasicAuth   *BasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	CaCert      string     `json:"ca_cert,omitempty" yaml:"ca_cert,omitempty"`
}

func (b *Auth) UnmarshalJSON(data []byte) error {
	var tmp Auth
	type plain Auth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *Auth) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Auth
	type plain Auth
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *Auth) validate() error {
	if len(b.BearerToken) == 0 && b.BasicAuth == nil && len(b.CaCert) == 0 {
		return fmt.Errorf("no authentication choosen")
	}
	if len(b.BearerToken) > 0 && b.BasicAuth != nil {
		return fmt.Errorf("basic_auth and bearer_token set at the same time")
	}
	return nil
}

type Config struct {
	// URL is the url required to contact the datasource
	URL *url.URL `json:"url" yaml:"url"`
	// AllowedEndpoints is a list of tuple of http method and http endpoint that will be accessible.
	// These parameters are only used when access is set to 'server'
	AllowedEndpoints []AllowedEndpoint `json:"allowed_endpoints,omitempty" yaml:"allowed_endpoints,omitempty"`
	// Headers can be used to provide additional header that needs to be forwarded when requesting the datasource
	// When defined, it's impossible to set the value of Access with 'browser'
	Headers map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
	// Secret is the name of the secret that should be used for the proxy or discovery configuration
	// It will contain any sensitive information such as password, token, certificate.
	Secret string `json:"secret,omitempty" yaml:"secret,omitempty"`
}

// tmpHTTPConfig is only used to custom the json/yaml marshalling/unmarshalling step.
// It shouldn't be used for other purpose.
type tmpHTTPConfig struct {
	URL              string            `json:"url" yaml:"url"`
	AllowedEndpoints []AllowedEndpoint `json:"allowed_endpoints,omitempty" yaml:"allowed_endpoints,omitempty"`
	Headers          map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
	Secret           string            `json:"secret,omitempty" yaml:"secret,omitempty"`
}

func (h *Config) MarshalJSON() ([]byte, error) {
	urlAsString := ""
	if h.URL != nil {
		urlAsString = h.URL.String()
	}
	tmp := &tmpHTTPConfig{
		URL:              urlAsString,
		AllowedEndpoints: h.AllowedEndpoints,
		Headers:          h.Headers,
		Secret:           h.Secret,
	}
	return json.Marshal(tmp)
}

func (h *Config) MarshalYAML() (interface{}, error) {
	urlAsString := ""
	if h.URL != nil {
		urlAsString = h.URL.String()
	}
	tmp := &tmpHTTPConfig{
		URL:              urlAsString,
		AllowedEndpoints: h.AllowedEndpoints,
		Headers:          h.Headers,
		Secret:           h.Secret,
	}
	return tmp, nil
}

func (h *Config) UnmarshalJSON(data []byte) error {
	var tmp tmpHTTPConfig
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if err := h.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (h *Config) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp tmpHTTPConfig
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if err := h.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (h *Config) validate(conf tmpHTTPConfig) error {
	u, err := url.Parse(conf.URL)
	if err != nil {
		return err
	}
	h.URL = u
	h.Headers = conf.Headers
	h.AllowedEndpoints = conf.AllowedEndpoints
	h.Secret = conf.Secret
	return nil
}
