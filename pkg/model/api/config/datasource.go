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
	"errors"
	"fmt"
	"net/netip"
	"strings"
	"time"

	"github.com/perses/spec/go/common"
)

type GlobalDatasourceConfig struct {
	// Disable is used to disable the global datasource feature.
	// It will also remove the associated proxy.
	// Also, since the global variable depends on the global datasource, it will also disable the global variable feature.
	Disable bool `json:"disable" yaml:"disable"`
	// Discovery is the configuration that helps to generate a list of global datasource based on the discovery chosen.
	// Be careful: the data coming from the discovery will totally override what exists in the database.
	// Note that this is an experimental feature. Behavior and config may change in the future.
	Discovery []GlobalDatasourceDiscovery `json:"discovery,omitempty" yaml:"discovery,omitempty"`
}

func (c *GlobalDatasourceConfig) Verify() error {
	if c.Disable && len(c.Discovery) > 0 {
		return fmt.Errorf("the global datasource is disabled, you cannot use the discovery feature")
	}
	return nil
}

type ProjectDatasourceConfig struct {
	// Disable is used to disable the project datasource feature.
	// It will also remove the associated proxy.
	Disable bool `json:"disable" yaml:"disable"`
}

const (
	DefaultHTTPProxyMaxIdleConns        = 100
	DefaultHTTPProxyMaxIdleConnsPerHost = 10
	// DefaultHTTPProxyTimeout is the default maximum amount of time allowed to establish a connection to a datasource.
	DefaultHTTPProxyTimeout = common.Duration(30 * time.Second)
)

// HTTPProxyConfig contains the configuration specific to the proxy used to forward the requests to the datasources of kind HTTPProxy.
// Each datasource has its own pool of connections, so every limit below applies per datasource.
type HTTPProxyConfig struct {
	// AllowedSchemes is the list of URL schemes an HTTP datasource is allowed to use.
	// Accepted values are "http" and "https". Default: ["http", "https"].
	AllowedSchemes []string `json:"allowed_schemes,omitempty" yaml:"allowed_schemes,omitempty"`
	// MaxConnsPerHost limits the total number of connections (in use and idle) that Perses opens,
	// for a given datasource, to a given host.
	// Once the limit is reached, the new requests wait until a connection is available,
	// or until they are canceled.
	// It can be used to protect Perses (file descriptors) and the datasources from a burst of queries.
	// Zero means no limit.
	MaxConnsPerHost int `json:"max_conns_per_host,omitempty" yaml:"max_conns_per_host,omitempty"`
	// MaxIdleConns limits the number of idle connections kept open, for a given datasource, across all hosts.
	// Idle connections are reused by the next requests, saving the TCP and TLS handshakes,
	// but each of them holds a socket and some memory.
	// Default: 100
	MaxIdleConns int `json:"max_idle_conns,omitempty" yaml:"max_idle_conns,omitempty"`
	// MaxIdleConnsPerHost limits the number of idle connections kept open, for a given datasource, to a given host.
	// A datasource usually talks to a single host, so it is in practice the number of idle connections kept per datasource.
	// Default: 10
	MaxIdleConnsPerHost int `json:"max_idle_conns_per_host,omitempty" yaml:"max_idle_conns_per_host,omitempty"`
	// DefaultTimeout is the maximum amount of time allowed to establish a connection to a datasource,
	// when the datasource doesn't define its own timeout (or sets it to 0).
	// Default: 30s, or MaxTimeout if it is lower
	DefaultTimeout common.Duration `json:"default_timeout,omitempty" yaml:"default_timeout,omitempty"`
	// MaxTimeout is the highest timeout a datasource can define. A datasource can only lower the timeout, never go beyond it.
	// A long timeout keeps goroutines and sockets busy against unreachable hosts,
	// so letting the users increase it freely would expose Perses to resource exhaustion.
	// Default: the value of DefaultTimeout
	MaxTimeout common.Duration `json:"max_timeout,omitempty" yaml:"max_timeout,omitempty"`
}

func (c *HTTPProxyConfig) Verify() error {
	for _, scheme := range c.AllowedSchemes {
		if s := strings.ToLower(scheme); s != "http" && s != "https" {
			return fmt.Errorf("datasource.proxy.http.allowed_schemes: %q is not supported, only 'http' and 'https' are accepted", scheme)
		}
	}
	if c.MaxConnsPerHost < 0 {
		return fmt.Errorf("datasource.proxy.http.max_conns_per_host cannot be negative")
	}
	if c.MaxIdleConns < 0 {
		return fmt.Errorf("datasource.proxy.http.max_idle_conns cannot be negative")
	}
	if c.MaxIdleConns == 0 {
		c.MaxIdleConns = DefaultHTTPProxyMaxIdleConns
	}
	if c.MaxIdleConnsPerHost < 0 {
		return fmt.Errorf("datasource.proxy.http.max_idle_conns_per_host cannot be negative")
	}
	if c.MaxIdleConnsPerHost == 0 {
		c.MaxIdleConnsPerHost = DefaultHTTPProxyMaxIdleConnsPerHost
	}
	if c.DefaultTimeout < 0 {
		return fmt.Errorf("datasource.proxy.http.default_timeout cannot be negative")
	}
	if c.MaxTimeout < 0 {
		return fmt.Errorf("datasource.proxy.http.max_timeout cannot be negative")
	}
	if c.DefaultTimeout == 0 {
		// When only max_timeout is set, it can be lower than the default value.
		// Lowering the maximum is the safe direction, so the default timeout follows it instead of failing.
		c.DefaultTimeout = DefaultHTTPProxyTimeout
		if c.MaxTimeout > 0 && c.MaxTimeout < c.DefaultTimeout {
			c.DefaultTimeout = c.MaxTimeout
		}
	}
	if c.MaxTimeout == 0 {
		c.MaxTimeout = c.DefaultTimeout
	}
	if c.DefaultTimeout > c.MaxTimeout {
		return fmt.Errorf("datasource.proxy.http.default_timeout (%s) cannot be greater than datasource.proxy.http.max_timeout (%s)", c.DefaultTimeout, c.MaxTimeout)
	}
	return nil
}

// ValidateTimeout verifies that the timeout defined in the spec of a datasource is allowed by the server configuration.
// It is meant to be used when the datasource is saved.
// An empty or zero timeout is valid: it means the datasource uses DefaultTimeout.
// A negative timeout is rejected as an invalid duration, since ParseDuration doesn't accept any sign.
func (c *HTTPProxyConfig) ValidateTimeout(timeout common.DurationString) error {
	if len(timeout) == 0 {
		return nil
	}
	d, err := common.ParseDuration(string(timeout))
	if err != nil {
		return fmt.Errorf("invalid timeout %q: %w", timeout, err)
	}
	if maxTimeout := c.maxTimeout(); time.Duration(d) > maxTimeout {
		return fmt.Errorf("timeout %q exceeds the maximum allowed by the server (%s)", timeout, common.Duration(maxTimeout))
	}
	return nil
}

// EffectiveTimeout returns the maximum amount of time allowed to establish a connection to a datasource
// defining the given timeout in its spec: min(timeout, MaxTimeout), or DefaultTimeout when the timeout is not set (or 0).
//
// The timeout is clamped at runtime, even though it is already validated when the datasource is saved (see ValidateTimeout),
// because MaxTimeout can have been lowered since the datasource has been saved.
func (c *HTTPProxyConfig) EffectiveTimeout(timeout common.DurationString) time.Duration {
	result := c.defaultTimeout()
	if len(timeout) > 0 {
		// An invalid timeout is not supposed to happen since it is validated when the spec is unmarshalled.
		// Anyway, fallback on the default timeout in that case.
		if d, err := common.ParseDuration(string(timeout)); err == nil && d > 0 {
			result = time.Duration(d)
		}
	}
	return min(result, c.maxTimeout())
}

// defaultTimeout returns DefaultTimeout.
// It falls back on DefaultHTTPProxyTimeout when the config has not been verified (see Verify), so the timeout is never unbounded.
func (c *HTTPProxyConfig) defaultTimeout() time.Duration {
	if c.DefaultTimeout <= 0 {
		return time.Duration(DefaultHTTPProxyTimeout)
	}
	return time.Duration(c.DefaultTimeout)
}

// maxTimeout returns MaxTimeout.
// It falls back on the default timeout when the config has not been verified (see Verify).
func (c *HTTPProxyConfig) maxTimeout() time.Duration {
	if c.MaxTimeout <= 0 {
		return c.defaultTimeout()
	}
	return time.Duration(c.MaxTimeout)
}

// DatasourceProxyConfig contains the configuration of the datasource proxy.
//
// The root fields restrict the destinations the proxy is allowed to reach, and apply to every kind of proxy (HTTP and SQL).
// Without restriction, anyone allowed to create a datasource (or to use the unsaved proxy endpoints) could use Perses
// to reach any service accessible from the Perses server (Server-Side Request Forgery): the Perses API itself through
// the loopback interface, the cloud metadata endpoints, the Kubernetes API, etc.
//
// Regardless of this configuration, the following networks are always denied, unless they are explicitly listed in
// AllowedNetworks: loopback (127.0.0.0/8, ::1), "this" network (0.0.0.0/8), link-local (169.254.0.0/16, fe80::/10),
// which includes most cloud metadata endpoints, the other known cloud metadata endpoints (100.100.100.200, fd00:ec2::254),
// multicast, reserved and deprecated ranges, and the Kubernetes API service IP when Perses is running in a Kubernetes cluster.
//
// The configuration specific to a kind of proxy lives in a dedicated struct (e.g. HTTP).
type DatasourceProxyConfig struct {
	// AllowedHosts, when not empty, is the exhaustive list of hosts the proxy can reach.
	// An entry is either an exact hostname (e.g. "prometheus.example.com"), a wildcard matching any subdomain
	// (e.g. "*.example.com") or an IP address. The port must not be provided.
	AllowedHosts []string `json:"allowed_hosts,omitempty" yaml:"allowed_hosts,omitempty"`
	// AllowedNetworks is a list of IP addresses or CIDRs that are always allowed.
	// It takes precedence over the denied networks (the built-in ones, DeniedNetworks and DenyPrivateNetworks).
	// For example, use ["127.0.0.0/8", "::1/128"] if your datasources are running on the same host as Perses.
	AllowedNetworks []string `json:"allowed_networks,omitempty" yaml:"allowed_networks,omitempty"`
	// DeniedNetworks is a list of IP addresses or CIDRs that are denied, in addition to the built-in ones.
	DeniedNetworks []string `json:"denied_networks,omitempty" yaml:"denied_networks,omitempty"`
	// DenyPrivateNetworks when true denies the private networks as well:
	// 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10, fc00::/7 and fec0::/10.
	DenyPrivateNetworks bool `json:"deny_private_networks" yaml:"deny_private_networks"`
	// HTTP contains the configuration specific to the proxy of the datasources of kind HTTPProxy.
	// +optional
	HTTP HTTPProxyConfig `json:"http,omitzero" yaml:"http,omitempty"`
}

func (c *DatasourceProxyConfig) Verify() error {
	for _, host := range c.AllowedHosts {
		if _, err := NormalizeHostPattern(host); err != nil {
			return fmt.Errorf("datasource.proxy.allowed_hosts: %w", err)
		}
	}
	for _, network := range c.AllowedNetworks {
		if _, err := ParseNetwork(network); err != nil {
			return fmt.Errorf("datasource.proxy.allowed_networks: %w", err)
		}
	}
	for _, network := range c.DeniedNetworks {
		if _, err := ParseNetwork(network); err != nil {
			return fmt.Errorf("datasource.proxy.denied_networks: %w", err)
		}
	}
	return nil
}

// ParseNetwork parses an IP address or a CIDR and returns the corresponding (masked) prefix.
// IPv4-mapped IPv6 networks are converted to their IPv4 equivalent.
func ParseNetwork(network string) (netip.Prefix, error) {
	s := strings.TrimSpace(network)
	var prefix netip.Prefix
	if strings.Contains(s, "/") {
		p, err := netip.ParsePrefix(s)
		if err != nil {
			return netip.Prefix{}, fmt.Errorf("invalid network %q: %w", network, err)
		}
		prefix = p
	} else {
		addr, err := netip.ParseAddr(s)
		if err != nil {
			return netip.Prefix{}, fmt.Errorf("invalid network %q: it must be an IP address or a CIDR", network)
		}
		addr = addr.WithZone("")
		prefix = netip.PrefixFrom(addr, addr.BitLen())
	}
	addr := prefix.Addr()
	bits := prefix.Bits()
	if addr.Is4In6() && bits >= 96 {
		addr = addr.Unmap()
		bits -= 96
	}
	return netip.PrefixFrom(addr, bits).Masked(), nil
}

// NormalizeHostPattern validates and normalizes an entry of DatasourceProxyConfig.AllowedHosts.
func NormalizeHostPattern(pattern string) (string, error) {
	p := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(pattern), "."))
	if len(p) == 0 {
		return "", errors.New("host cannot be empty")
	}
	if addr, err := netip.ParseAddr(strings.TrimSuffix(strings.TrimPrefix(p, "["), "]")); err == nil {
		return addr.WithZone("").Unmap().String(), nil
	}
	if strings.ContainsAny(p, "/:@?#[] ") {
		return "", fmt.Errorf("%q must be a hostname or an IP address, without scheme, port or path", pattern)
	}
	hostname := strings.TrimPrefix(p, "*.")
	if len(hostname) == 0 || strings.Contains(hostname, "*") {
		return "", fmt.Errorf("%q is not a valid host: only a leading wildcard such as '*.example.com' is supported", pattern)
	}
	return p, nil
}

type DatasourceConfig struct {
	Global  GlobalDatasourceConfig  `json:"global" yaml:"global"`
	Project ProjectDatasourceConfig `json:"project" yaml:"project"`
	// DisableLocal when used is preventing the possibility to add a datasource directly in the dashboard spec.
	// It will also disable the associated proxy.
	DisableLocal bool `json:"disable_local" yaml:"disable_local"`
	// Proxy contains the configuration of the datasource proxy: the destinations it is allowed to reach (whatever the kind of proxy),
	// and the configuration specific to each kind of proxy.
	Proxy DatasourceProxyConfig `json:"proxy" yaml:"proxy"`
}
