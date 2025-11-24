// Copyright 2025 The Perses Authors
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

	"github.com/perses/perses/pkg/model/api/v1/common"
)

type AllowedEndpoint struct {
	EndpointPattern common.Regexp `json:"endpointPattern" yaml:"endpointPattern"`
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

func (h *AllowedEndpoint) UnmarshalYAML(unmarshal func(any) error) error {
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
	URL *common.URL `json:"url" yaml:"url"`
	// AllowedEndpoints is a list of tuple of http method and http endpoint that will be accessible.
	// If not set, then everything is accessible.
	AllowedEndpoints []AllowedEndpoint `json:"allowedEndpoints,omitempty" yaml:"allowedEndpoints,omitempty"`
	// Headers can be used to provide additional header that needs to be forwarded when requesting the datasource
	// When defined, it's impossible to set the value of Access with 'browser'
	Headers map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
	// Secret is the name of the secret that should be used for the proxy or discovery configuration
	// It will contain any sensitive information such as password, token, certificate.
	Secret string `json:"secret,omitempty" yaml:"secret,omitempty"`
}

func (h *Config) UnmarshalJSON(data []byte) error {
	var tmp Config
	type plain Config
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *Config) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp Config
	type plain Config
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*h = tmp
	return nil
}

func (h *Config) validate() error {
	if h.URL == nil {
		return fmt.Errorf("url cannot be empty")
	}
	return nil
}

type Proxy struct {
	Kind string `json:"kind" yaml:"kind"`
	Spec Config `json:"spec" yaml:"spec"`
}

const (
	ProxyKindName = "httpproxy"
)
