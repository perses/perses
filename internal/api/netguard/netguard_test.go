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

package netguard

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"net/url"
	"testing"

	"github.com/perses/perses/pkg/model/api/config"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newGuard(t *testing.T, cfg config.DatasourceProxyConfig) *Guard {
	t.Helper()
	g, err := New(cfg)
	require.NoError(t, err)
	return g
}

func TestCheckIP(t *testing.T) {
	defaultCfg := config.DatasourceProxyConfig{}
	denyPrivateCfg := config.DatasourceProxyConfig{DenyPrivateNetworks: true}
	testSuite := []struct {
		title   string
		cfg     config.DatasourceProxyConfig
		ip      string
		allowed bool
	}{
		// built-in denied networks
		{title: "loopback", cfg: defaultCfg, ip: "127.0.0.1"},
		{title: "loopback range", cfg: defaultCfg, ip: "127.1.2.3"},
		{title: "loopback ipv6", cfg: defaultCfg, ip: "::1"},
		{title: "ipv4-mapped loopback", cfg: defaultCfg, ip: "::ffff:127.0.0.1"},
		{title: "ipv4-compatible loopback", cfg: defaultCfg, ip: "::127.0.0.1"},
		{title: "unspecified", cfg: defaultCfg, ip: "0.0.0.0"},
		{title: "unspecified ipv6", cfg: defaultCfg, ip: "::"},
		{title: "cloud metadata", cfg: defaultCfg, ip: "169.254.169.254"},
		{title: "ipv4-mapped cloud metadata", cfg: defaultCfg, ip: "::ffff:169.254.169.254"},
		{title: "aws metadata ipv6", cfg: defaultCfg, ip: "fd00:ec2::254"},
		{title: "alibaba metadata", cfg: defaultCfg, ip: "100.100.100.200"},
		{title: "link-local ipv6 with zone", cfg: defaultCfg, ip: "fe80::1%eth0"},
		{title: "multicast", cfg: defaultCfg, ip: "224.0.0.1"},
		{title: "broadcast", cfg: defaultCfg, ip: "255.255.255.255"},
		{title: "multicast ipv6", cfg: defaultCfg, ip: "ff02::1"},
		{title: "nat64 embedding loopback", cfg: defaultCfg, ip: "64:ff9b::7f00:1"},
		{title: "nat64 embedding cloud metadata", cfg: defaultCfg, ip: "64:ff9b::a9fe:a9fe"},
		{title: "6to4 embedding loopback", cfg: defaultCfg, ip: "2002:7f00:1::"},
		{title: "teredo", cfg: defaultCfg, ip: "2001:0:4136:e378:8000:63bf:3fff:fdd2"},
		// allowed by default
		{title: "private 10/8", cfg: defaultCfg, ip: "10.0.0.1", allowed: true},
		{title: "private 192.168/16", cfg: defaultCfg, ip: "192.168.1.1", allowed: true},
		{title: "unique local address", cfg: defaultCfg, ip: "fd12::1", allowed: true},
		{title: "public ipv4", cfg: defaultCfg, ip: "8.8.8.8", allowed: true},
		{title: "public ipv6", cfg: defaultCfg, ip: "2001:4860:4860::8888", allowed: true},
		{title: "nat64 embedding a public ipv4", cfg: defaultCfg, ip: "64:ff9b::808:808", allowed: true},
		// deny_private_networks
		{title: "deny private 10/8", cfg: denyPrivateCfg, ip: "10.0.0.1"},
		{title: "deny private 172.16/12", cfg: denyPrivateCfg, ip: "172.16.5.4"},
		{title: "deny private cgnat", cfg: denyPrivateCfg, ip: "100.64.0.1"},
		{title: "deny unique local address", cfg: denyPrivateCfg, ip: "fd12::1"},
		{title: "deny nat64 embedding a private ipv4", cfg: denyPrivateCfg, ip: "64:ff9b::a00:1"},
		{title: "deny private keeps public allowed", cfg: denyPrivateCfg, ip: "8.8.8.8", allowed: true},
		// allowed_networks takes precedence
		{title: "allowed loopback address", cfg: config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.1"}}, ip: "127.0.0.1", allowed: true},
		{title: "allowed loopback address doesn't allow the whole range", cfg: config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.1"}}, ip: "127.0.0.2"},
		{title: "allowed ipv4-mapped network", cfg: config.DatasourceProxyConfig{AllowedNetworks: []string{"::ffff:127.0.0.0/104"}}, ip: "127.0.0.1", allowed: true},
		{title: "allowed network overrides deny_private_networks", cfg: config.DatasourceProxyConfig{DenyPrivateNetworks: true, AllowedNetworks: []string{"10.1.0.0/16"}}, ip: "10.1.2.3", allowed: true},
		{title: "allowed network is limited to its range", cfg: config.DatasourceProxyConfig{DenyPrivateNetworks: true, AllowedNetworks: []string{"10.1.0.0/16"}}, ip: "10.2.0.1"},
		// denied_networks
		{title: "denied network", cfg: config.DatasourceProxyConfig{DeniedNetworks: []string{"8.8.8.0/24"}}, ip: "8.8.8.8"},
		{title: "strict allow-list with networks", cfg: config.DatasourceProxyConfig{DeniedNetworks: []string{"0.0.0.0/0", "::/0"}, AllowedNetworks: []string{"10.0.0.0/8"}}, ip: "8.8.8.8"},
		{title: "strict allow-list with networks: allowed", cfg: config.DatasourceProxyConfig{DeniedNetworks: []string{"0.0.0.0/0", "::/0"}, AllowedNetworks: []string{"10.0.0.0/8"}}, ip: "10.0.0.1", allowed: true},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			g := newGuard(t, test.cfg)
			err := g.CheckIP(netip.MustParseAddr(test.ip))
			if test.allowed {
				assert.NoError(t, err)
			} else {
				assert.True(t, IsDenied(err), "expected a denied error, got %v", err)
			}
		})
	}
}

func TestCheckIP_KubernetesAPIDenied(t *testing.T) {
	t.Setenv("KUBERNETES_SERVICE_HOST", "10.96.0.1")
	g := newGuard(t, config.DatasourceProxyConfig{})
	assert.True(t, IsDenied(g.CheckIP(netip.MustParseAddr("10.96.0.1"))))
	assert.NoError(t, g.CheckIP(netip.MustParseAddr("10.96.0.2")))

	g = newGuard(t, config.DatasourceProxyConfig{AllowedNetworks: []string{"10.96.0.1"}})
	assert.NoError(t, g.CheckIP(netip.MustParseAddr("10.96.0.1")))
}

func TestValidateURL(t *testing.T) {
	loopbackCfg := config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.0/8", "::1/128"}}
	httpsOnlyCfg := config.DatasourceProxyConfig{HTTP: config.HTTPProxyConfig{AllowedSchemes: []string{"HTTPS"}}}
	allowedHostsCfg := config.DatasourceProxyConfig{AllowedHosts: []string{"prometheus.example.com", "*.monitoring.svc", "10.0.0.1"}}
	testSuite := []struct {
		title   string
		cfg     config.DatasourceProxyConfig
		url     string
		allowed bool
	}{
		{title: "perses itself through loopback (report reproduction)", url: "http://127.0.0.1:8080"},
		{title: "localhost", url: "http://localhost:9090"},
		{title: "localhost uppercase with trailing dot", url: "http://LOCALHOST.:9090"},
		{title: "localhost subdomain", url: "http://perses.localhost:8080"},
		{title: "ipv6 loopback", url: "http://[::1]:8080"},
		{title: "ipv4-mapped ipv6 loopback", url: "http://[::ffff:127.0.0.1]:8080"},
		{title: "cloud metadata", url: "http://169.254.169.254/latest/meta-data/"},
		{title: "unspecified", url: "http://0.0.0.0:8080"},
		{title: "file scheme", url: "file:///etc/passwd"},
		{title: "gopher scheme", url: "gopher://127.0.0.1:6379/_INFO"},
		{title: "ftp scheme", url: "ftp://ftp.example.com"},
		{title: "no host", url: "http://"},
		{title: "opaque url", url: "http:prometheus"},
		{title: "service name", url: "http://prometheus:9090", allowed: true},
		{title: "public host", url: "https://demo.prometheus.io", allowed: true},
		{title: "uppercase scheme", url: "HTTP://prometheus:9090", allowed: true},
		{title: "private ip", url: "http://10.0.0.1:9090", allowed: true},
		{title: "localhost with loopback allowed", cfg: loopbackCfg, url: "http://localhost:9090", allowed: true},
		{title: "loopback allowed", cfg: loopbackCfg, url: "http://127.0.0.1:9090", allowed: true},
		{title: "cloud metadata still denied when loopback allowed", cfg: loopbackCfg, url: "http://169.254.169.254"},
		{title: "https only denies http", cfg: httpsOnlyCfg, url: "http://prometheus:9090"},
		{title: "https only allows https", cfg: httpsOnlyCfg, url: "https://prometheus:9090", allowed: true},
		{title: "allowed host", cfg: allowedHostsCfg, url: "http://prometheus.example.com:9090", allowed: true},
		{title: "allowed host is case insensitive", cfg: allowedHostsCfg, url: "http://PROMETHEUS.example.com.", allowed: true},
		{title: "allowed wildcard host", cfg: allowedHostsCfg, url: "http://thanos.monitoring.svc:9090", allowed: true},
		{title: "wildcard doesn't match the apex", cfg: allowedHostsCfg, url: "http://monitoring.svc"},
		{title: "wildcard doesn't match a suffix without dot", cfg: allowedHostsCfg, url: "http://evilmonitoring.svc"},
		{title: "allowed ip host", cfg: allowedHostsCfg, url: "http://10.0.0.1:9090", allowed: true},
		{title: "host not allowed", cfg: allowedHostsCfg, url: "http://evil.example.com"},
		{title: "ip not in the allowed hosts", cfg: allowedHostsCfg, url: "http://10.0.0.2"},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			g := newGuard(t, test.cfg)
			u, err := url.Parse(test.url)
			require.NoError(t, err)
			err = g.ValidateURL(u)
			if test.allowed {
				assert.NoError(t, err)
			} else {
				assert.True(t, IsDenied(err), "expected a denied error, got %v", err)
			}
		})
	}
}

func TestValidateSQLHost(t *testing.T) {
	testSuite := []struct {
		title   string
		host    string
		allowed bool
	}{
		{title: "localhost with port", host: "localhost:5432"},
		{title: "loopback without port", host: "127.0.0.1"},
		{title: "ipv6 loopback", host: "[::1]:3306"},
		{title: "ipv6 metadata without port", host: "[fd00:ec2::254]"},
		{title: "unix socket", host: "/var/run/postgresql"},
		{title: "abstract unix socket", host: "@mysql"},
		{title: "empty", host: " "},
		{title: "one of the hosts denied", host: "db1:5432,127.0.0.1:5432"},
		{title: "service name", host: "db:5432", allowed: true},
		{title: "private ip", host: "10.0.0.1:3306", allowed: true},
		{title: "multiple hosts", host: "db1:5432, db2:5432", allowed: true},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := newGuard(t, config.DatasourceProxyConfig{}).ValidateSQLHost(test.host)
			if test.allowed {
				assert.NoError(t, err)
			} else {
				assert.True(t, IsDenied(err), "expected a denied error, got %v", err)
			}
		})
	}
}

func TestValidateDatasourceSpec(t *testing.T) {
	testSuite := []struct {
		title       string
		spec        string
		expectError bool
		isDenied    bool
	}{
		{
			title:       "http proxy to loopback (report reproduction)",
			spec:        `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://127.0.0.1:8080"}}}}}`,
			expectError: true,
			isDenied:    true,
		},
		{
			title:       "sql proxy to loopback",
			spec:        `{"plugin":{"kind":"PostgresDatasource","spec":{"proxy":{"kind":"SQLProxy","spec":{"driver":"postgres","host":"localhost:5432","database":"perses"}}}}}`,
			expectError: true,
			isDenied:    true,
		},
		{
			title: "http proxy to a service",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://prometheus:9090"}}}}}`,
		},
		{
			title: "sql proxy to a service",
			spec:  `{"plugin":{"kind":"PostgresDatasource","spec":{"proxy":{"kind":"SQLProxy","spec":{"driver":"postgres","host":"postgres:5432","database":"perses"}}}}}`,
		},
		{
			title: "direct url is queried by the browser",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"directUrl":"http://127.0.0.1:9090"}}}`,
		},
		{
			title:       "proxy without spec",
			spec:        `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy"}}}}`,
			expectError: true,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			var spec datasourceSpec.Spec
			require.NoError(t, json.Unmarshal([]byte(test.spec), &spec))
			err := newGuard(t, config.DatasourceProxyConfig{}).ValidateDatasourceSpec(spec)
			if !test.expectError {
				assert.NoError(t, err)
				return
			}
			assert.Error(t, err)
			assert.Equal(t, test.isDenied, IsDenied(err))
		})
	}
}

func TestNilGuardAppliesDefaultPolicy(t *testing.T) {
	var g *Guard
	assert.True(t, IsDenied(g.ValidateURL(&url.URL{Scheme: "http", Host: "127.0.0.1:8080"})))
	assert.NoError(t, g.ValidateURL(&url.URL{Scheme: "http", Host: "prometheus:9090"}))
	assert.True(t, IsDenied(g.CheckIP(netip.MustParseAddr("169.254.169.254"))))
}

func TestDialContext(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer func() { _ = listener.Close() }()
	go func() {
		for {
			conn, acceptErr := listener.Accept()
			if acceptErr != nil {
				return
			}
			_ = conn.Close()
		}
	}()
	_, port, err := net.SplitHostPort(listener.Addr().String())
	require.NoError(t, err)

	ctx := context.Background()
	defaultGuard := newGuard(t, config.DatasourceProxyConfig{})

	// A hostname is not statically verified by DialContext: the verification happens on the resolved IP address,
	// which is what protects against DNS names (or DNS rebinding) pointing to a forbidden IP address.
	_, err = defaultGuard.DialContext(ctx, "tcp", net.JoinHostPort("localhost", port))
	assert.True(t, IsDenied(err), "expected a denied error, got %v", err)

	_, err = defaultGuard.DialContext(ctx, "tcp", listener.Addr().String())
	assert.True(t, IsDenied(err), "expected a denied error, got %v", err)

	_, err = defaultGuard.DialContext(ctx, "unix", "/var/run/postgresql/.s.PGSQL.5432")
	assert.True(t, IsDenied(err), "expected a denied error, got %v", err)

	allowedHostsGuard := newGuard(t, config.DatasourceProxyConfig{AllowedHosts: []string{"db.example.com"}, AllowedNetworks: []string{"127.0.0.1"}})
	_, err = allowedHostsGuard.DialContext(ctx, "tcp", listener.Addr().String())
	assert.True(t, IsDenied(err), "expected a denied error, got %v", err)

	loopbackGuard := newGuard(t, config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.1"}})
	conn, err := loopbackGuard.DialContext(ctx, "tcp", listener.Addr().String())
	require.NoError(t, err)
	_ = conn.Close()
}

func TestHTTPTransport(t *testing.T) {
	// The server is listening on 127.0.0.1. Only this address is allowed, and it redirects to 127.0.0.2 which is denied.
	var redirectTarget string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/redirect" {
			w.Header().Set("Location", redirectTarget)
			w.WriteHeader(http.StatusFound)
			return
		}
		_, _ = w.Write([]byte("ok"))
	}))
	defer server.Close()
	_, port, err := net.SplitHostPort(server.Listener.Addr().String())
	require.NoError(t, err)
	redirectTarget = fmt.Sprintf("http://127.0.0.2:%s/", port)

	g := newGuard(t, config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.1"}})
	client := &http.Client{Transport: g.HTTPTransport(nil, 0)}

	resp, err := client.Get(server.URL)
	require.NoError(t, err)
	_ = resp.Body.Close()
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Redirections followed by an HTTP client (like the OAuth token request) are verified at connection time too.
	_, err = client.Get(server.URL + "/redirect")
	assert.True(t, IsDenied(err), "expected a denied error, got %v", err)

	client = &http.Client{Transport: newGuard(t, config.DatasourceProxyConfig{}).HTTPTransport(nil, 0)}
	_, err = client.Get(server.URL)
	assert.True(t, IsDenied(err), "expected a denied error, got %v", err)
}

func TestCheckProxiedDestination(t *testing.T) {
	g := newGuard(t, config.DatasourceProxyConfig{})
	ctx := context.Background()
	assert.True(t, IsDenied(g.checkProxiedDestination(ctx, &url.URL{Scheme: "http", Host: "169.254.169.254"})))
	assert.True(t, IsDenied(g.checkProxiedDestination(ctx, &url.URL{Scheme: "http", Host: "localhost:8080"})))
	assert.NoError(t, g.checkProxiedDestination(ctx, &url.URL{Scheme: "http", Host: "10.0.0.1:9090"}))
}

func TestCanonicalAddr(t *testing.T) {
	assert.Equal(t, "proxy:80", canonicalAddr(&url.URL{Scheme: "http", Host: "proxy"}))
	assert.Equal(t, "proxy:443", canonicalAddr(&url.URL{Scheme: "https", Host: "proxy"}))
	assert.Equal(t, "proxy:1080", canonicalAddr(&url.URL{Scheme: "socks5", Host: "proxy"}))
	assert.Equal(t, "proxy:3128", canonicalAddr(&url.URL{Scheme: "http", Host: "proxy:3128"}))
	assert.Equal(t, "[::1]:3128", canonicalAddr(&url.URL{Scheme: "http", Host: "[::1]:3128"}))
}

func TestNew_InvalidConfig(t *testing.T) {
	for _, cfg := range []config.DatasourceProxyConfig{
		{HTTP: config.HTTPProxyConfig{AllowedSchemes: []string{"file"}}},
		{AllowedHosts: []string{"http://prometheus"}},
		{AllowedNetworks: []string{"not-a-network"}},
		{DeniedNetworks: []string{"10.0.0.0/33"}},
	} {
		_, err := New(cfg)
		assert.Error(t, err)
	}
}
