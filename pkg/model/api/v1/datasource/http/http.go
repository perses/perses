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
	"reflect"
	"strings"

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

type Config struct {
	// URL is the url required to contact the datasource
	URL *url.URL `json:"url" yaml:"url"`
	// AllowedEndpoints is a list of tuple of http method and http endpoint that will be accessible.
	// If not set, then everything is accessible.
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

func (h Config) MarshalJSON() ([]byte, error) {
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

func (h Config) MarshalYAML() (interface{}, error) {
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
	return h.validate(tmp)
}

func (h *Config) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp tmpHTTPConfig
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	return h.validate(tmp)
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

type Proxy struct {
	Kind string `json:"kind" yaml:"kind"`
	Spec Config `json:"spec" yaml:"spec"`
}

const (
	httpProxyKindField = "kind"
	httpProxyKindName  = "httpproxy"
	httpProxySpec      = "spec"
)

func ValidateAndExtract(pluginSpec interface{}) (*Config, error) {
	finder := &configFinder{}
	finder.find(reflect.ValueOf(pluginSpec))
	return finder.config, finder.err
}

type configFinder struct {
	err    error
	found  bool
	config *Config
}

func (c *configFinder) find(v reflect.Value) {
	if len(v.Type().PkgPath()) > 0 {
		// the field is not exported, so no need to look at it as we won't be able to set it in a later stage
		return
	}
	v = getNextElem(v)

	switch v.Kind() {
	case reflect.Struct:
		c.findInStruct(v)
	case reflect.Map:
		c.findInMap(v)
	}
}

// findInStruct assumed that v is of type reflect.Struct
func (c *configFinder) findInStruct(v reflect.Value) {
	// first look at the field and find if we have the good kind
	c.found = doesKindInStructExists(v)
	if c.found {
		// then get the spec field
		spec := getConfigSpecInStruct(v)
		// Then unmarshal the proxy to validate the content
		c.unmarshalConfig(spec)
	} else {
		// Otherwise look deeper to find it
		for i := 0; i < v.NumField(); i++ {
			c.find(v.Field(i))
			if c.found || c.err != nil {
				return
			}
		}
	}
}

// findInMap assumed that v is of type reflect.Map
func (c *configFinder) findInMap(v reflect.Value) {
	keyType := v.Type().Key()
	if keyType.Kind() != reflect.String {
		return
	}
	c.found = doesKindInMapExists(v)
	if c.found {
		// then get the spec field
		spec := getConfigSpecInMap(v)
		// Then unmarshal the proxy to validate the content
		c.unmarshalConfig(spec)
	} else {
		// Otherwise look deeper to find it
		for _, key := range v.MapKeys() {
			c.find(v.MapIndex(key))
			if c.found || c.err != nil {
				return
			}
		}
	}
}

func (c *configFinder) unmarshalConfig(spec reflect.Value) {
	if spec == (reflect.Value{}) {
		return
	}
	spec = getNextElem(spec)
	var data []byte
	if spec.Kind() == reflect.Struct {
		data, c.err = json.Marshal(spec.Interface().(Config))
	} else {
		data, c.err = json.Marshal(spec.Interface())
	}
	if c.err != nil {
		return
	}
	c.config = &Config{}
	c.err = json.Unmarshal(data, c.config)
}

func doesKindInStructExists(v reflect.Value) bool {
	for i := 0; i < v.NumField(); i++ {
		if strings.ToLower(v.Type().Field(i).Name) == httpProxyKindField &&
			v.Field(i).Type().Kind() == reflect.String &&
			strings.ToLower(v.Field(i).String()) == httpProxyKindName {
			return true
		}
	}
	return false
}

func doesKindInMapExists(v reflect.Value) bool {
	for _, key := range v.MapKeys() {
		if key.String() == httpProxyKindField {
			value := v.MapIndex(key)
			value = getNextElem(value)
			if value.Kind() == reflect.String &&
				strings.ToLower(value.String()) == httpProxyKindName {
				return true
			}
		}
	}
	return false
}

func getConfigSpecInStruct(v reflect.Value) reflect.Value {
	for i := 0; i < v.NumField(); i++ {
		if strings.ToLower(v.Type().Field(i).Name) == httpProxySpec {
			return v.Field(i)
		}
	}
	return reflect.Value{}
}

func getConfigSpecInMap(v reflect.Value) reflect.Value {
	for _, key := range v.MapKeys() {
		if key.String() == httpProxySpec {
			return v.MapIndex(key)
		}
	}
	return reflect.Value{}
}

func getNextElem(v reflect.Value) reflect.Value {
	if v.Kind() == reflect.Interface || (v.Kind() == reflect.Ptr && !v.IsNil()) {
		return v.Elem()
	}
	return v
}
