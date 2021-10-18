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

package datasource

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"github.com/perses/perses/pkg/model/api/v1/common"
)

type HTTPAccess string

const (
	BrowserHTTPAccess = "browser"
	ServerHTTPAccess  = "server"
)

var httpAccessMap = map[HTTPAccess]bool{
	BrowserHTTPAccess: true,
	ServerHTTPAccess:  true,
}

func (h *HTTPAccess) UnmarshalJSON(data []byte) error {
	var tmp HTTPAccess
	type plain HTTPAccess
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *HTTPAccess) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp HTTPAccess
	type plain HTTPAccess
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *HTTPAccess) validate() error {
	if len(*h) == 0 {
		*h = ServerHTTPAccess
	}
	if _, ok := httpAccessMap[*h]; !ok {
		return fmt.Errorf("unknown http.access '%s' used", *h)
	}
	return nil
}

type HTTPAllowedEndpoint struct {
	EndpointPattern common.Regexp `json:"endpoint_pattern" yaml:"endpoint_pattern"`
	Method          string        `json:"method" yaml:"method"`
}

func (h *HTTPAllowedEndpoint) UnmarshalJSON(data []byte) error {
	var tmp HTTPAllowedEndpoint
	type plain HTTPAllowedEndpoint
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := h.validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *HTTPAllowedEndpoint) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp HTTPAllowedEndpoint
	type plain HTTPAllowedEndpoint
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *HTTPAllowedEndpoint) validate() error {
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
		data, err := ioutil.ReadFile(b.PasswordFile)
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
		_, err := ioutil.ReadFile(b.PasswordFile)
		if err != nil {
			return err
		}
	}
	return nil
}

type HTTPAuth struct {
	InsecureTLS bool       `json:"insecure_tls,omitempty" yaml:"insecure_tls,omitempty"`
	BearerToken string     `json:"bearer_token,omitempty" yaml:"bearer_token,omitempty"`
	BasicAuth   *BasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	CaCert      string     `json:"ca_cert,omitempty" yaml:"ca_cert,omitempty"`
}

func (b *HTTPAuth) UnmarshalJSON(data []byte) error {
	var tmp HTTPAuth
	type plain HTTPAuth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *HTTPAuth) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp HTTPAuth
	type plain HTTPAuth
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *HTTPAuth) validate() error {
	if len(b.BearerToken) == 0 && b.BasicAuth == nil && len(b.CaCert) == 0 {
		return fmt.Errorf("no authentication choosen")
	}
	if len(b.BearerToken) > 0 && b.BasicAuth != nil {
		return fmt.Errorf("basic_auth and bearer_token set at the same time")
	}
	return nil
}

type HTTPConfig struct {
	// URL is the url required to contact the datasource
	URL *url.URL `json:"url" yaml:"url"`
	// The way the UI will contact the datasource. Or through the Backend or directly.
	// By default, Access is set with the value 'server'
	Access HTTPAccess `json:"access,omitempty" yaml:"access,omitempty"`
	// AllowedEndpoints is a list of tuple of http method and http endpoint that will be accessible.
	// These parameters are only used when access is set to 'server'
	AllowedEndpoints []HTTPAllowedEndpoint `json:"allowed_endpoints,omitempty" yaml:"allowed_endpoints,omitempty"`
	// Auth is holding any security configuration for the http configuration.
	// When defined, it's impossible to set the value of Access with 'browser'
	Auth *HTTPAuth `json:"auth,omitempty" yaml:"auth,omitempty"`
	// Headers can be used to provide additional header that needs to be forwarded when requesting the datasource
	// When defined, it's impossible to set the value of Access with 'browser'
	Headers map[string]string `yaml:"headers,omitempty"`
}

// tmpHTTPConfig is only used to custom the json/yaml marshalling/unmarshalling step.
// It shouldn't be used for other purpose.
type tmpHTTPConfig struct {
	URL              string                `json:"url" yaml:"url"`
	Access           HTTPAccess            `json:"access,omitempty" yaml:"access,omitempty"`
	AllowedEndpoints []HTTPAllowedEndpoint `json:"allowed_endpoints,omitempty" yaml:"allowed_endpoints,omitempty"`
	Auth             *HTTPAuth             `json:"auth,omitempty" yaml:"auth,omitempty"`
	Headers          map[string]string     `yaml:"headers,omitempty"`
}

func (h *HTTPConfig) MarshalJSON() ([]byte, error) {
	urlAsString := ""
	if h.URL != nil {
		urlAsString = h.URL.String()
	}
	tmp := &tmpHTTPConfig{
		URL:              urlAsString,
		Access:           h.Access,
		AllowedEndpoints: h.AllowedEndpoints,
		Auth:             h.Auth,
		Headers:          h.Headers,
	}
	return json.Marshal(tmp)
}

func (h *HTTPConfig) MarshalYAML() (interface{}, error) {
	urlAsString := ""
	if h.URL != nil {
		urlAsString = h.URL.String()
	}
	tmp := &tmpHTTPConfig{
		URL:              urlAsString,
		Access:           h.Access,
		AllowedEndpoints: h.AllowedEndpoints,
		Auth:             h.Auth,
		Headers:          h.Headers,
	}
	return tmp, nil
}

func (h *HTTPConfig) UnmarshalJSON(data []byte) error {
	var tmp tmpHTTPConfig
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if err := h.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (h *HTTPConfig) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp tmpHTTPConfig
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if err := h.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (h *HTTPConfig) validate(conf tmpHTTPConfig) error {
	if u, err := url.Parse(conf.URL); err != nil {
		return err
	} else {
		h.URL = u
	}
	if len(conf.Access) == 0 {
		conf.Access = ServerHTTPAccess
	}
	if conf.Access == BrowserHTTPAccess {
		if conf.Auth != nil {
			return fmt.Errorf("datasource cannot be used directly from the UI when 'http.auth' is configured. Set access value with 'server' instead")
		}
		if len(conf.AllowedEndpoints) > 0 {
			return fmt.Errorf("http.whitelist cannot be set when 'http.access' is set with the value 'browser'")
		}
		if len(conf.Headers) > 0 {
			return fmt.Errorf("http.headers cannot be set when 'http.access' is set with the value 'browser'")
		}
	}
	h.Access = conf.Access
	h.Auth = conf.Auth
	h.Headers = conf.Headers
	h.AllowedEndpoints = conf.AllowedEndpoints
	return nil
}
