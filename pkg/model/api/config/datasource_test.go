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

	"github.com/perses/common/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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
