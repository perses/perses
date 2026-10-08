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

package proxy

import (
	"testing"
	"time"

	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/internal/api/impl/proxy/http"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/spec/go/common"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeAuthorization struct {
	authorization.Authorization
	enabled bool
	native  bool
}

func (f *fakeAuthorization) IsEnabled() bool     { return f.enabled }
func (f *fakeAuthorization) IsNativeAuthz() bool { return f.native }

func TestEndpoint_forwardCallerAuthorization(t *testing.T) {
	for _, test := range []struct {
		name     string
		authz    authorization.Authorization
		expected bool
	}{
		{name: "no authorization: safe default", authz: nil, expected: false},
		{name: "native authorization: the header contains the Perses token", authz: &fakeAuthorization{enabled: true, native: true}, expected: false},
		{name: "delegated authorization", authz: &fakeAuthorization{enabled: true, native: false}, expected: true},
		{name: "authorization disabled", authz: &fakeAuthorization{enabled: false, native: true}, expected: true},
	} {
		t.Run(test.name, func(t *testing.T) {
			e := &endpoint{authz: test.authz}
			assert.Equal(t, test.expected, e.forwardCallerAuthorization())
		})
	}
}

// TestEndpoint_newProxy_connectionLimits ensures the limits set in the config (datasource.proxy.http)
// are given to the HTTP proxy, and that the unset ones fall back to their defaults.
// Applying them to the transport is covered by TestHTTPProxy_getTransport_connectionLimits (http package).
func TestEndpoint_newProxy_connectionLimits(t *testing.T) {
	spec := datasourceSpec.Spec{
		Plugin: plugin.Plugin{
			Kind: "PrometheusDatasource",
			Spec: map[string]any{
				"proxy": map[string]any{
					"kind": "HTTPProxy",
					"spec": map[string]any{"url": "http://localhost:9090"},
				},
			},
		},
	}
	custom := config.HTTPProxyConfig{MaxConnsPerHost: 3, MaxIdleConns: 20, MaxIdleConnsPerHost: 2}
	for _, test := range []struct {
		name         string
		proxyConfig  config.HTTPProxyConfig
		transportKey string
		expected     config.HTTPProxyConfig
	}{
		{
			name:         "defaults",
			transportKey: globalTransportKey("prometheus"),
			expected: config.HTTPProxyConfig{
				MaxConnsPerHost:     0,
				MaxIdleConns:        config.DefaultHTTPProxyMaxIdleConns,
				MaxIdleConnsPerHost: config.DefaultHTTPProxyMaxIdleConnsPerHost,
			},
		},
		{name: "limits applied to a saved datasource", proxyConfig: custom, transportKey: globalTransportKey("prometheus"), expected: custom},
		{name: "limits applied to an unsaved datasource", proxyConfig: custom, transportKey: "", expected: custom},
	} {
		t.Run(test.name, func(t *testing.T) {
			// The config is verified when Perses loads it, which also sets the default values.
			proxyConfig := test.proxyConfig
			require.NoError(t, proxyConfig.Verify())
			e := &endpoint{
				cfg:        config.DatasourceConfig{Proxy: config.DatasourceProxyConfig{HTTP: proxyConfig}},
				transports: httpproxy.NewTransportCache(),
				guard:      proxytest.NewLoopbackGuard(t),
			}
			pr, err := e.newProxy("prometheus", "", test.transportKey, spec, "/api/v1/query", nil)
			require.NoError(t, err)
			h, ok := pr.(*httpproxy.Proxy)
			require.True(t, ok)
			assert.Same(t, e.transports, h.Transports)
			assert.Equal(t, test.transportKey, h.TransportKey)
			assert.Equal(t, test.expected.MaxConnsPerHost, h.ProxyConfig.MaxConnsPerHost)
			assert.Equal(t, test.expected.MaxIdleConns, h.ProxyConfig.MaxIdleConns)
			assert.Equal(t, test.expected.MaxIdleConnsPerHost, h.ProxyConfig.MaxIdleConnsPerHost)
		})
	}
}

// TestEndpoint_newProxy_timeout ensures the connection timeout of the HTTP proxy is the one defined by the datasource,
// bounded by the server configuration (datasource.proxy.http.default_timeout and max_timeout).
func TestEndpoint_newProxy_timeout(t *testing.T) {
	newSpec := func(timeout string) datasourceSpec.Spec {
		proxySpec := map[string]any{"url": "http://localhost:9090"}
		if len(timeout) > 0 {
			proxySpec["timeout"] = timeout
		}
		return datasourceSpec.Spec{
			Plugin: plugin.Plugin{
				Kind: "PrometheusDatasource",
				Spec: map[string]any{
					"proxy": map[string]any{"kind": "HTTPProxy", "spec": proxySpec},
				},
			},
		}
	}
	serverCfg := config.HTTPProxyConfig{DefaultTimeout: common.Duration(10 * time.Second), MaxTimeout: common.Duration(time.Minute)}
	for _, test := range []struct {
		name        string
		proxyConfig config.HTTPProxyConfig
		timeout     string
		expected    time.Duration
	}{
		{name: "server defaults", expected: time.Duration(config.DefaultHTTPProxyTimeout)},
		{name: "server defaults: the datasource cannot increase the timeout", timeout: "5m", expected: time.Duration(config.DefaultHTTPProxyTimeout)},
		{name: "server defaults: the datasource can lower the timeout", timeout: "5s", expected: 5 * time.Second},
		{name: "no timeout in the datasource: default timeout of the server", proxyConfig: serverCfg, expected: 10 * time.Second},
		{name: "zero timeout in the datasource: default timeout of the server", proxyConfig: serverCfg, timeout: "0s", expected: 10 * time.Second},
		{name: "timeout of the datasource", proxyConfig: serverCfg, timeout: "45s", expected: 45 * time.Second},
		{name: "timeout of the datasource clamped to the maximum of the server", proxyConfig: serverCfg, timeout: "10m", expected: time.Minute},
	} {
		t.Run(test.name, func(t *testing.T) {
			// The config is verified when Perses loads it, which also sets the default values.
			proxyConfig := test.proxyConfig
			require.NoError(t, proxyConfig.Verify())
			e := &endpoint{
				cfg:        config.DatasourceConfig{Proxy: config.DatasourceProxyConfig{HTTP: proxyConfig}},
				transports: httpproxy.NewTransportCache(),
				guard:      proxytest.NewLoopbackGuard(t),
			}
			pr, err := e.newProxy("prometheus", "", globalTransportKey("prometheus"), newSpec(test.timeout), "/api/v1/query", nil)
			require.NoError(t, err)
			h, ok := pr.(*httpproxy.Proxy)
			require.True(t, ok)
			assert.Equal(t, test.expected, h.ProxyConfig.EffectiveTimeout(h.Config.Timeout))
		})
	}
}
