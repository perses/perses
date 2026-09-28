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
	"net/netip"
	"testing"
	"time"

	"github.com/perses/common/config"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHTTPProxyConfig_Verify_rejectsNegativeTimeouts(t *testing.T) {
	testSuite := []struct {
		title      string
		cfg        HTTPProxyConfig
		errMessage string
	}{
		{
			title:      "negative default_timeout",
			cfg:        HTTPProxyConfig{DefaultTimeout: common.Duration(-time.Second)},
			errMessage: "datasource.http_proxy.default_timeout cannot be negative",
		},
		{
			title:      "negative max_timeout",
			cfg:        HTTPProxyConfig{MaxTimeout: common.Duration(-time.Second)},
			errMessage: "datasource.http_proxy.max_timeout cannot be negative",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			assert.EqualError(t, test.cfg.Verify(), test.errMessage)
		})
	}
}

func TestHTTPProxyConfig_ValidateTimeout(t *testing.T) {
	cfg := HTTPProxyConfig{DefaultTimeout: common.Duration(10 * time.Second), MaxTimeout: common.Duration(time.Minute)}
	require.NoError(t, cfg.Verify())
	testSuite := []struct {
		title      string
		timeout    common.DurationString
		errMessage string
	}{
		{title: "not set", timeout: ""},
		{title: "zero", timeout: "0"},
		{title: "zero with a unit", timeout: "0s"},
		{title: "lower than the default", timeout: "5s"},
		{title: "between the default and the maximum", timeout: "45s"},
		{title: "equal to the maximum", timeout: "1m"},
		{
			title:      "greater than the maximum",
			timeout:    "1m1s",
			errMessage: `timeout "1m1s" exceeds the maximum allowed by the server (1m)`,
		},
		{
			title:      "far beyond the maximum",
			timeout:    "1y",
			errMessage: `timeout "1y" exceeds the maximum allowed by the server (1m)`,
		},
		{
			title:      "negative",
			timeout:    "-5s",
			errMessage: `invalid timeout "-5s": not a valid duration string: "-5s"`,
		},
		{
			title:      "invalid",
			timeout:    "30 seconds",
			errMessage: `invalid timeout "30 seconds": unknown unit " seconds" in duration "30 seconds"`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := cfg.ValidateTimeout(test.timeout)
			if len(test.errMessage) == 0 {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, test.errMessage)
			}
		})
	}
}

func TestHTTPProxyConfig_EffectiveTimeout(t *testing.T) {
	verified := func(cfg HTTPProxyConfig) HTTPProxyConfig {
		require.NoError(t, cfg.Verify())
		return cfg
	}
	serverCfg := verified(HTTPProxyConfig{DefaultTimeout: common.Duration(10 * time.Second), MaxTimeout: common.Duration(time.Minute)})
	testSuite := []struct {
		title    string
		cfg      HTTPProxyConfig
		timeout  common.DurationString
		expected time.Duration
	}{
		{title: "not set: default timeout", cfg: serverCfg, timeout: "", expected: 10 * time.Second},
		{title: "zero: default timeout", cfg: serverCfg, timeout: "0", expected: 10 * time.Second},
		{title: "lower than the default", cfg: serverCfg, timeout: "2s", expected: 2 * time.Second},
		{title: "between the default and the maximum", cfg: serverCfg, timeout: "45s", expected: 45 * time.Second},
		{title: "equal to the maximum", cfg: serverCfg, timeout: "1m", expected: time.Minute},
		{title: "clamped to the maximum", cfg: serverCfg, timeout: "1h", expected: time.Minute},
		{
			// The datasource has been saved with a timeout that was allowed at that time, then the maximum has been lowered.
			title:    "clamped to the maximum lowered after the datasource has been saved",
			cfg:      verified(HTTPProxyConfig{DefaultTimeout: common.Duration(5 * time.Second), MaxTimeout: common.Duration(20 * time.Second)}),
			timeout:  "45s",
			expected: 20 * time.Second,
		},
		{title: "invalid: default timeout", cfg: serverCfg, timeout: "30 seconds", expected: 10 * time.Second},
		{title: "default server config: default timeout", cfg: verified(HTTPProxyConfig{}), timeout: "", expected: 30 * time.Second},
		{title: "default server config: cannot go beyond the default timeout", cfg: verified(HTTPProxyConfig{}), timeout: "5m", expected: 30 * time.Second},
		{title: "only max_timeout set lower than the default value: default timeout follows it", cfg: verified(HTTPProxyConfig{MaxTimeout: common.Duration(10 * time.Second)}), timeout: "", expected: 10 * time.Second},
		{title: "config not verified: default timeout", cfg: HTTPProxyConfig{}, timeout: "", expected: 30 * time.Second},
		{title: "config not verified: bounded by the default timeout", cfg: HTTPProxyConfig{}, timeout: "5m", expected: 30 * time.Second},
		{title: "config not verified: lower timeout", cfg: HTTPProxyConfig{}, timeout: "5s", expected: 5 * time.Second},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, test.cfg.EffectiveTimeout(test.timeout))
		})
	}
}

func TestParseNetwork(t *testing.T) {
	testSuite := []struct {
		network string
		result  string
		isErr   bool
	}{
		{network: "127.0.0.0/8", result: "127.0.0.0/8"},
		{network: " 10.1.2.3/8 ", result: "10.0.0.0/8"},
		{network: "127.0.0.1", result: "127.0.0.1/32"},
		{network: "::1", result: "::1/128"},
		{network: "fe80::1%eth0", result: "fe80::1/128"},
		{network: "::ffff:127.0.0.0/104", result: "127.0.0.0/8"},
		{network: "::ffff:127.0.0.1", result: "127.0.0.1/32"},
		{network: "fd00::/8", result: "fd00::/8"},
		{network: "localhost", isErr: true},
		{network: "10.0.0.0/33", isErr: true},
		{network: "", isErr: true},
	}
	for _, test := range testSuite {
		t.Run(test.network, func(t *testing.T) {
			prefix, err := ParseNetwork(test.network)
			if test.isErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, netip.MustParsePrefix(test.result), prefix)
		})
	}
}

func TestNormalizeHostPattern(t *testing.T) {
	testSuite := []struct {
		pattern string
		result  string
		isErr   bool
	}{
		{pattern: "Prometheus.Example.com.", result: "prometheus.example.com"},
		{pattern: "*.monitoring.svc", result: "*.monitoring.svc"},
		{pattern: "10.0.0.1", result: "10.0.0.1"},
		{pattern: "[::1]", result: "::1"},
		{pattern: "::ffff:10.0.0.1", result: "10.0.0.1"},
		{pattern: "http://prometheus", isErr: true},
		{pattern: "prometheus:9090", isErr: true},
		{pattern: "prometheus/api", isErr: true},
		{pattern: "*", isErr: true},
		{pattern: "*.", isErr: true},
		{pattern: "prom.*.svc", isErr: true},
		{pattern: "", isErr: true},
	}
	for _, test := range testSuite {
		t.Run(test.pattern, func(t *testing.T) {
			result, err := NormalizeHostPattern(test.pattern)
			if test.isErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLDatasourceProxyConfig(t *testing.T) {
	c := Config{}
	require.NoError(t, config.NewResolver[Config]().
		SetConfigData([]byte(`
datasource:
  proxy:
    allowed_schemes:
      - https
    allowed_hosts:
      - "*.monitoring.svc"
    allowed_networks:
      - "127.0.0.1/32"
    denied_networks:
      - "10.96.0.0/12"
    deny_private_networks: true
`)).
		Resolve(&c).
		Verify())
	assert.Equal(t, DatasourceProxyConfig{
		AllowedSchemes:      []string{"https"},
		AllowedHosts:        []string{"*.monitoring.svc"},
		AllowedNetworks:     []string{"127.0.0.1/32"},
		DeniedNetworks:      []string{"10.96.0.0/12"},
		DenyPrivateNetworks: true,
	}, c.Datasource.Proxy)
}

func TestDatasourceProxyConfigVerify(t *testing.T) {
	testSuite := []struct {
		title string
		cfg   DatasourceProxyConfig
		isErr bool
	}{
		{title: "empty config", cfg: DatasourceProxyConfig{}},
		{title: "valid config", cfg: DatasourceProxyConfig{
			AllowedSchemes:  []string{"http", "HTTPS"},
			AllowedHosts:    []string{"prometheus.example.com", "*.svc"},
			AllowedNetworks: []string{"127.0.0.1", "::1/128"},
			DeniedNetworks:  []string{"10.0.0.0/8"},
		}},
		{title: "unsupported scheme", cfg: DatasourceProxyConfig{AllowedSchemes: []string{"file"}}, isErr: true},
		{title: "invalid host", cfg: DatasourceProxyConfig{AllowedHosts: []string{"https://prometheus"}}, isErr: true},
		{title: "invalid allowed network", cfg: DatasourceProxyConfig{AllowedNetworks: []string{"localhost"}}, isErr: true},
		{title: "invalid denied network", cfg: DatasourceProxyConfig{DeniedNetworks: []string{"300.0.0.0/8"}}, isErr: true},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := test.cfg.Verify()
			if test.isErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
