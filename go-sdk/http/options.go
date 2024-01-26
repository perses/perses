// Copyright 2024 The Perses Authors
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
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
)

func WithURL(url string) Option {
	return func(builder *Builder) error {
		u, err := common.ParseURL(url)
		if err != nil {
			return err
		}
		builder.Spec.URL = u
		return nil
	}
}

func WithAllowedEndpoints(endpoints ...http.AllowedEndpoint) Option {
	return func(builder *Builder) error {
		builder.Spec.AllowedEndpoints = endpoints
		return nil
	}
}

func AddAllowedEndpoint(method string, endpointPattern string) Option {
	return func(builder *Builder) error {
		reg, err := common.NewRegexp(endpointPattern)
		if err != nil {
			return err
		}

		builder.Spec.AllowedEndpoints = append(builder.Spec.AllowedEndpoints, http.AllowedEndpoint{
			EndpointPattern: reg,
			Method:          method,
		})
		return nil
	}
}

func WithHeaders(headers map[string]string) Option {
	return func(builder *Builder) error {
		builder.Spec.Headers = headers
		return nil
	}
}

func AddHeader(key string, value string) Option {
	return func(builder *Builder) error {
		if builder.Spec.Headers == nil {
			builder.Spec.Headers = make(map[string]string)
		}

		builder.Spec.Headers[key] = value
		return nil
	}
}

func WithSecret(name string) Option {
	return func(builder *Builder) error {
		builder.Spec.Secret = name
		return nil
	}
}
