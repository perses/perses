package http

import (
	"net/url"

	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
)

func NewHTTPProxy(proxyURL url.URL) *ProxyBuilder {
	return &ProxyBuilder{
		http.Proxy{
			Kind: "HTTPProxy",
			Spec: http.Config{
				URL: &proxyURL,
			},
		},
	}
}

type ProxyBuilder struct {
	http.Proxy
}

func (b *ProxyBuilder) Build() http.Proxy {
	return b.Proxy
}

func (b *ProxyBuilder) WithURL(proxyURL url.URL) *ProxyBuilder {
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
