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
	"net/url"
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

type HTTPWhiteListConfiguration struct {
	Endpoint string `json:"endpoint" yaml:"endpoint"`
	Method   string `json:"method" yaml:"method"`
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
	if err := json.Unmarshal(data, &tmp); err != nil {
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
	if err := unmarshal(&tmp); err != nil {
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

type HTTPConfiguration struct {
	// URL is the url required to contact the datasource
	URL *url.URL `json:"url" yaml:"url"`
	// The way the UI will contact the datasource. Or through the Backend or directly.
	// By default, Access is set with the value 'server'
	Access HTTPAccess `json:"access,omitempty" yaml:"access,omitempty"`
	// WhiteList is a list of tuple of http method and http endpoint that will be accessible.
	// These parameters are only used when access is set to 'server'
	WhiteList []HTTPWhiteListConfiguration `json:"white_list" yaml:"white_list"`
	// Auth is holding any security configuration for the http configuration.
	// When defined, it's impossible to set the value of Access with 'browser'
	Auth *HTTPAuth `json:"auth,omitempty" yaml:"auth,omitempty"`
	// Headers can be used to provide additional header that needs to be forwarded when requesting the datasource
	// When defined, it's impossible to set the value of Access with 'browser'
	Headers map[string]string `yaml:"headers,omitempty"`
}

// tmpHTTPConfiguration is only used to custom the json/yaml marshalling/unmarshalling step.
// It shouldn't be used for other purpose.
type tmpHTTPConfiguration struct {
	URL       string                       `json:"url" yaml:"url"`
	Access    HTTPAccess                   `json:"access,omitempty" yaml:"access,omitempty"`
	WhiteList []HTTPWhiteListConfiguration `json:"white_list" yaml:"white_list"`
	Auth      *HTTPAuth                    `json:"auth,omitempty" yaml:"auth,omitempty"`
	Headers   map[string]string            `yaml:"headers,omitempty"`
}

func (h *HTTPConfiguration) MarshalJSON() ([]byte, error) {
	urlAsString := ""
	if h.URL != nil {
		urlAsString = h.URL.String()
	}
	tmp := &tmpHTTPConfiguration{
		URL:       urlAsString,
		Access:    h.Access,
		WhiteList: h.WhiteList,
		Auth:      h.Auth,
		Headers:   h.Headers,
	}
	return json.Marshal(tmp)
}

func (h *HTTPConfiguration) MarshalYAML() (interface{}, error) {
	urlAsString := ""
	if h.URL != nil {
		urlAsString = h.URL.String()
	}
	tmp := &tmpHTTPConfiguration{
		URL:       urlAsString,
		Access:    h.Access,
		WhiteList: h.WhiteList,
		Auth:      h.Auth,
		Headers:   h.Headers,
	}
	return tmp, nil
}

func (h *HTTPConfiguration) UnmarshalJSON(data []byte) error {
	var tmp tmpHTTPConfiguration
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if err := h.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (h *HTTPConfiguration) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp tmpHTTPConfiguration
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if err := h.validate(tmp); err != nil {
		return err
	}
	return nil
}

func (h *HTTPConfiguration) validate(conf tmpHTTPConfiguration) error {
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
		if len(conf.WhiteList) > 0 {
			return fmt.Errorf("http.whitelist cannot be set when 'http.access' is set with the value 'browser'")
		}
		if len(conf.Headers) > 0 {
			return fmt.Errorf("http.headers cannot be set when 'http.access' is set with the value 'browser'")
		}
	}
	return nil
}
