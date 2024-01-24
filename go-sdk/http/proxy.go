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

func NewHTTPProxy(proxyURL common.URL) *ProxyBuilder {
	return &ProxyBuilder{
		http.Proxy{
			Kind: "HTTPProxy",
			Spec: http.Config{
				URL: &proxyURL,
			},
		},
	}
}

func NewHTTPProxyStr(proxyURL string) (*ProxyBuilder, error) {
	u, err := common.ParseURL(proxyURL)
	if err != nil {
		return nil, err
	}

	return &ProxyBuilder{
		http.Proxy{
			Kind: "HTTPProxy",
			Spec: http.Config{
				URL: u,
			},
		},
	}, nil
}

type ProxyBuilder struct {
	http.Proxy
}

func (b *ProxyBuilder) Build() http.Proxy {
	return b.Proxy
}

func (b *ProxyBuilder) WithURL(proxyURL common.URL) *ProxyBuilder {
	b.Spec.URL = &proxyURL
	return b
}

func (b *ProxyBuilder) WithAllowedEndpoints(endpoints []http.AllowedEndpoint) *ProxyBuilder {
	b.Spec.AllowedEndpoints = endpoints
	return b
}

func (b *ProxyBuilder) AddAllowedEndpoint(endpoint http.AllowedEndpoint) *ProxyBuilder {
	b.Spec.AllowedEndpoints = append(b.Spec.AllowedEndpoints, endpoint)
	return b
}

func (b *ProxyBuilder) WithHeaders(headers map[string]string) *ProxyBuilder {
	b.Spec.Headers = headers
	return b
}

func (b *ProxyBuilder) AddHeader(key string, value string) *ProxyBuilder {
	if b.Spec.Headers == nil {
		b.Spec.Headers = make(map[string]string)
	}
	b.Spec.Headers[key] = value
	return b
}

func (b *ProxyBuilder) RemoveHeader(key string) *ProxyBuilder {
	if b.Spec.Headers == nil {
		return b
	}
	delete(b.Spec.Headers, key)
	return b
}

func (b *ProxyBuilder) WithSecret(secret string) *ProxyBuilder {
	b.Spec.Secret = secret
	return b
}
