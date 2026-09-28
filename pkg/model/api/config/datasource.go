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

// DatasourceProxyConfig restricts the destinations the datasource proxy is allowed to reach.
// Without restriction, anyone allowed to create a datasource (or to use the unsaved proxy endpoints) could use Perses
// to reach any service accessible from the Perses server (Server-Side Request Forgery): the Perses API itself through
// the loopback interface, the cloud metadata endpoints, the Kubernetes API, etc.
//
// Regardless of this configuration, the following networks are always denied, unless they are explicitly listed in
// AllowedNetworks: loopback (127.0.0.0/8, ::1), "this" network (0.0.0.0/8), link-local (169.254.0.0/16, fe80::/10),
// which includes most cloud metadata endpoints, the other known cloud metadata endpoints (100.100.100.200, fd00:ec2::254),
// multicast, reserved and deprecated ranges, and the Kubernetes API service IP when Perses is running in a Kubernetes cluster.
type DatasourceProxyConfig struct {
	// AllowedSchemes is the list of URL schemes an HTTP datasource is allowed to use.
	// Accepted values are "http" and "https". Default: ["http", "https"].
	AllowedSchemes []string `json:"allowed_schemes,omitempty" yaml:"allowed_schemes,omitempty"`
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
}

func (c *DatasourceProxyConfig) Verify() error {
	for _, scheme := range c.AllowedSchemes {
		if s := strings.ToLower(scheme); s != "http" && s != "https" {
			return fmt.Errorf("datasource.proxy.allowed_schemes: %q is not supported, only 'http' and 'https' are accepted", scheme)
		}
	}
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
	// Proxy restricts the destinations the datasource proxy is allowed to reach.
	Proxy DatasourceProxyConfig `json:"proxy" yaml:"proxy"`
}
