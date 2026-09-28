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

// Package netguard restricts the network destinations the datasource proxy is allowed to reach.
//
// The datasource proxy forwards requests to a URL (or connects to a SQL host) coming from the datasource spec, which is
// provided by the users. Without restriction, it can be used to reach any service accessible from the Perses server
// (Server-Side Request Forgery): the Perses API itself through the loopback interface, the cloud metadata endpoints,
// the Kubernetes API, etc. As the proxy reflects the response, it would be a full read channel on these services.
//
// The Guard provides two levels of verification:
//   - A static verification of the URL / host (ValidateURL, ValidateSQLHost, ValidateDatasourceSpec), done when a
//     datasource is saved and before a request is proxied. It provides an early and clear error message.
//   - A verification at connection time (DialContext, HTTPTransport), done on every IP address the destination resolves
//     to, including the ones reached through a redirection. This is the actual protection, as it cannot be bypassed with a
//     DNS name pointing to a forbidden IP address (including DNS rebinding) or with an alternative IP notation.
package netguard

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"slices"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/perses/perses/pkg/model/api/config"
	datasourcev1 "github.com/perses/perses/pkg/model/api/v1/datasource"
	datasourceSpec "github.com/perses/spec/go/datasource"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
)

const (
	schemeHTTP    = "http"
	schemeHTTPS   = "https"
	dialTimeout   = 30 * time.Second
	dialKeepAlive = 30 * time.Second
	configHint    = "if this destination is legitimate, ask your administrator to review the 'datasource.proxy' section of the Perses configuration"
)

// ErrDenied is the error (wrapped) returned when a destination is not allowed.
// Use IsDenied or errors.Is to detect it.
var ErrDenied = errors.New("destination not allowed")

type deniedError struct {
	msg string
}

func (e *deniedError) Error() string {
	return fmt.Sprintf("%s: %s; %s", ErrDenied.Error(), e.msg, configHint)
}

func (e *deniedError) Is(target error) bool {
	return target == ErrDenied
}

func deny(format string, args ...any) error {
	return &deniedError{msg: fmt.Sprintf(format, args...)}
}

// IsDenied returns true if the error (or one of the errors it wraps) is due to a destination not allowed.
func IsDenied(err error) bool {
	return errors.Is(err, ErrDenied)
}

var (
	defaultAllowedSchemes = []string{schemeHTTP, schemeHTTPS}
	// builtinDeniedNetworks are the networks that are always denied, unless explicitly listed in allowed_networks.
	// No datasource is expected to be there, while they give access to sensitive services.
	builtinDeniedNetworks = mustParseNetworks(
		"0.0.0.0/8",          // "this" network. On most systems, 0.0.0.0 reaches the local host.
		"127.0.0.0/8",        // loopback
		"169.254.0.0/16",     // link-local, including the metadata endpoint of AWS, GCP, Azure, OpenStack, Oracle, DigitalOcean...
		"100.100.100.200/32", // Alibaba Cloud metadata endpoint
		"224.0.0.0/4",        // multicast
		"240.0.0.0/4",        // reserved, including the broadcast address
		"::/96",              // unspecified, loopback and deprecated IPv4-compatible addresses
		"fe80::/10",          // link-local
		"ff00::/8",           // multicast
		"fd00:ec2::254/128",  // AWS metadata endpoint (IPv6)
		"2001::/32",          // Teredo, embedding an obfuscated IPv4 address
		"64:ff9b:1::/48",     // local-use NAT64, embedding an IPv4 address at a position depending on the local configuration
	)
	privateNetworks = mustParseNetworks(
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"100.64.0.0/10", // carrier-grade NAT
		"fc00::/7",      // unique local addresses
		"fec0::/10",     // deprecated site-local addresses
	)
	// Networks embedding an IPv4 address in their last 32 bits.
	// The embedded IPv4 is verified as well, as it's the actual destination once translated.
	nat64Networks = mustParseNetworks(
		"64:ff9b::/96",    // well-known NAT64 prefix
		"::ffff:0:0:0/96", // IPv4-translated addresses
	)
	sixToFourNetwork = netip.MustParsePrefix("2002::/16")
	ipv4Loopback     = netip.MustParseAddr("127.0.0.1")
	ipv6Loopback     = netip.IPv6Loopback()

	defaultGuard = mustNew(config.DatasourceProxyConfig{})
)

// Guard verifies that a destination is allowed according to the datasource proxy configuration.
// A nil *Guard is valid and applies the default policy.
type Guard struct {
	allowedSchemes  []string
	allowedHosts    []string
	allowedNetworks []netip.Prefix
	deniedNetworks  []netip.Prefix
	resolver        *net.Resolver
}

// New creates a Guard from the datasource proxy configuration.
func New(cfg config.DatasourceProxyConfig) (*Guard, error) {
	g := &Guard{
		allowedSchemes: defaultAllowedSchemes,
		deniedNetworks: slices.Clone(builtinDeniedNetworks),
		resolver:       net.DefaultResolver,
	}
	if len(cfg.AllowedSchemes) > 0 {
		g.allowedSchemes = make([]string, 0, len(cfg.AllowedSchemes))
		for _, scheme := range cfg.AllowedSchemes {
			s := strings.ToLower(scheme)
			if s != schemeHTTP && s != schemeHTTPS {
				return nil, fmt.Errorf("scheme %q is not supported, only 'http' and 'https' are accepted", scheme)
			}
			g.allowedSchemes = append(g.allowedSchemes, s)
		}
	}
	for _, host := range cfg.AllowedHosts {
		pattern, err := config.NormalizeHostPattern(host)
		if err != nil {
			return nil, err
		}
		g.allowedHosts = append(g.allowedHosts, pattern)
	}
	for _, network := range cfg.AllowedNetworks {
		prefix, err := config.ParseNetwork(network)
		if err != nil {
			return nil, err
		}
		g.allowedNetworks = append(g.allowedNetworks, prefix)
	}
	for _, network := range cfg.DeniedNetworks {
		prefix, err := config.ParseNetwork(network)
		if err != nil {
			return nil, err
		}
		g.deniedNetworks = append(g.deniedNetworks, prefix)
	}
	if cfg.DenyPrivateNetworks {
		g.deniedNetworks = append(g.deniedNetworks, privateNetworks...)
	}
	// When Perses is running in a Kubernetes cluster, the Kubernetes API is reachable through a (private) service IP.
	// Perses doesn't need the proxy to reach it, so it's denied by default.
	if k8sAPI, err := netip.ParseAddr(os.Getenv("KUBERNETES_SERVICE_HOST")); err == nil {
		k8sAPI = k8sAPI.WithZone("").Unmap()
		g.deniedNetworks = append(g.deniedNetworks, netip.PrefixFrom(k8sAPI, k8sAPI.BitLen()))
	}
	return g, nil
}

func mustNew(cfg config.DatasourceProxyConfig) *Guard {
	g, err := New(cfg)
	if err != nil {
		panic(err)
	}
	return g
}

func mustParseNetworks(networks ...string) []netip.Prefix {
	result := make([]netip.Prefix, 0, len(networks))
	for _, network := range networks {
		prefix, err := config.ParseNetwork(network)
		if err != nil {
			panic(err)
		}
		result = append(result, prefix)
	}
	return result
}

func (g *Guard) orDefault() *Guard {
	if g == nil {
		return defaultGuard
	}
	return g
}

// ValidateDatasourceSpec statically verifies the destination of the proxy defined in the datasource spec, if any.
// It doesn't resolve any DNS name; the resolved IP addresses are verified at connection time.
func (g *Guard) ValidateDatasourceSpec(spec datasourceSpec.Spec) error {
	cfg, kind, err := datasourcev1.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		return err
	}
	switch kind {
	case datasourceHTTP.ProxyKindName:
		httpConfig, ok := cfg.(*datasourceHTTP.Config)
		if !ok || httpConfig == nil || httpConfig.URL == nil {
			return errors.New("the HTTP proxy config is missing the url")
		}
		return g.ValidateURL(httpConfig.URL.URL)
	case datasourceSQL.ProxyKindName:
		sqlConfig, ok := cfg.(*datasourceSQL.Config)
		if !ok || sqlConfig == nil {
			return errors.New("the SQL proxy config is missing")
		}
		return g.ValidateSQLHost(sqlConfig.Host)
	default:
		// No proxy defined: the datasource is directly queried by the browser.
		return nil
	}
}

// ValidateURL statically verifies that the URL of an HTTP datasource is allowed.
func (g *Guard) ValidateURL(u *url.URL) error {
	g = g.orDefault()
	if u == nil {
		return deny("the url is empty")
	}
	if !slices.Contains(g.allowedSchemes, strings.ToLower(u.Scheme)) {
		return deny("the scheme %q is not allowed, allowed schemes: %s", u.Scheme, strings.Join(g.allowedSchemes, ", "))
	}
	if len(u.Hostname()) == 0 {
		return deny("the url %q doesn't have any host", u.Redacted())
	}
	return g.validateHost(u.Hostname())
}

// ValidateSQLHost statically verifies that the host (or the comma-separated list of hosts) of a SQL datasource is allowed.
// A host can contain a port. Unix sockets are not allowed.
func (g *Guard) ValidateSQLHost(hosts string) error {
	g = g.orDefault()
	if len(strings.TrimSpace(hosts)) == 0 {
		return deny("the host is empty")
	}
	for _, host := range strings.Split(hosts, ",") {
		host = strings.TrimSpace(host)
		if strings.HasPrefix(host, "/") || strings.HasPrefix(host, "@") {
			return deny("unix sockets are not allowed")
		}
		hostname, _, err := net.SplitHostPort(host)
		if err != nil {
			// no port provided
			hostname = strings.TrimSuffix(strings.TrimPrefix(host, "["), "]")
		}
		if err := g.validateHost(hostname); err != nil {
			return err
		}
	}
	return nil
}

// CheckIP verifies that the IP address is allowed.
func (g *Guard) CheckIP(ip netip.Addr) error {
	g = g.orDefault()
	if !ip.IsValid() {
		return deny("invalid IP address")
	}
	ip = ip.WithZone("").Unmap()
	if g.isInAllowedNetworks(ip) {
		return nil
	}
	if g.isInDeniedNetworks(ip) {
		return deny("the IP address %s is part of a denied network", ip)
	}
	if embedded, ok := embeddedIPv4(ip); ok {
		if g.isInAllowedNetworks(embedded) {
			return nil
		}
		if g.isInDeniedNetworks(embedded) {
			return deny("the IP address %s embeds the IPv4 address %s which is part of a denied network", ip, embedded)
		}
	}
	return nil
}

// DialContext establishes a TCP connection after having verified the destination.
// The verification is done on each IP address the destination resolves to, just before connecting to it.
// It can be used as a dial function for the SQL drivers.
func (g *Guard) DialContext(ctx context.Context, network, address string) (net.Conn, error) {
	return g.dialContext(ctx, network, address, dialTimeout)
}

// dialContext is the same as DialContext, with a custom timeout to establish the connection.
func (g *Guard) dialContext(ctx context.Context, network, address string, timeout time.Duration) (net.Conn, error) {
	g = g.orDefault()
	switch network {
	case "tcp", "tcp4", "tcp6":
	default:
		return nil, deny("the network %q is not allowed", network)
	}
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return nil, err
	}
	if !g.isHostAllowed(normalizeHost(host)) {
		return nil, deny("the host %q is not part of the allowed hosts", host)
	}
	dialer := &net.Dialer{
		Timeout:   timeout,
		KeepAlive: dialKeepAlive,
		// Control is called once the address is resolved, just before connecting to each IP address.
		Control: func(_, resolvedAddress string, _ syscall.RawConn) error {
			addrPort, parseErr := netip.ParseAddrPort(resolvedAddress)
			if parseErr != nil {
				return deny("unable to verify the destination %q", resolvedAddress)
			}
			return g.CheckIP(addrPort.Addr())
		},
	}
	return dialer.DialContext(ctx, network, address)
}

// HTTPTransport returns an HTTP transport where every connection is verified by the Guard.
// As the verification is done at connection time, it also applies to the redirections followed by an HTTP client.
//
// The HTTP proxy configured through the environment (HTTP_PROXY, HTTPS_PROXY, NO_PROXY) is honored, and considered
// as trusted since it's configured by the administrator of the Perses server. As the proxy resolves the final
// destination, the destination is verified upfront instead.
//
// connectTimeout is the maximum amount of time allowed to establish a connection. When zero or negative, a default of 30s is used.
func (g *Guard) HTTPTransport(tlsConfig *tls.Config, connectTimeout time.Duration) *http.Transport {
	g = g.orDefault()
	if connectTimeout <= 0 {
		connectTimeout = dialTimeout
	}
	var proxyAddresses sync.Map
	directDialer := &net.Dialer{Timeout: connectTimeout, KeepAlive: dialKeepAlive}
	return &http.Transport{
		Proxy: func(req *http.Request) (*url.URL, error) {
			proxyURL, err := http.ProxyFromEnvironment(req)
			if err != nil || proxyURL == nil {
				return proxyURL, err
			}
			if checkErr := g.checkProxiedDestination(req.Context(), req.URL); checkErr != nil {
				return nil, checkErr
			}
			proxyAddresses.Store(canonicalAddr(proxyURL), struct{}{})
			return proxyURL, nil
		},
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			if _, isProxy := proxyAddresses.Load(address); isProxy {
				return directDialer.DialContext(ctx, network, address)
			}
			return g.dialContext(ctx, network, address, connectTimeout)
		},
		TLSHandshakeTimeout: 10 * time.Second,
		IdleConnTimeout:     90 * time.Second,
		ForceAttemptHTTP2:   true,
		TLSClientConfig:     tlsConfig,
	}
}

// checkProxiedDestination verifies a destination that will be reached through an HTTP proxy.
// The connection is established with the proxy, so the final destination cannot be verified at connection time.
func (g *Guard) checkProxiedDestination(ctx context.Context, u *url.URL) error {
	if err := g.ValidateURL(u); err != nil {
		return err
	}
	host := u.Hostname()
	if _, err := netip.ParseAddr(host); err == nil {
		// Already verified by ValidateURL.
		return nil
	}
	ips, err := g.resolver.LookupNetIP(ctx, "ip", host)
	if err != nil {
		// The name might only be resolvable by the proxy (split DNS). The static verification passed, so let the proxy
		// handle it. The allowed_hosts configuration is the way to strictly restrict the destinations in this situation.
		return nil
	}
	for _, ip := range ips {
		if checkErr := g.CheckIP(ip); checkErr != nil {
			return checkErr
		}
	}
	return nil
}

func (g *Guard) validateHost(host string) error {
	host = normalizeHost(host)
	if len(host) == 0 {
		return deny("the host is empty")
	}
	if !g.isHostAllowed(host) {
		return deny("the host %q is not part of the allowed hosts", host)
	}
	if ip, err := netip.ParseAddr(host); err == nil {
		return g.CheckIP(ip)
	}
	// RFC 6761: "localhost" and its subdomains always resolve to the loopback interface.
	if host == "localhost" || strings.HasSuffix(host, ".localhost") {
		if g.CheckIP(ipv4Loopback) != nil && g.CheckIP(ipv6Loopback) != nil {
			return deny("the host %q targets the loopback interface", host)
		}
	}
	return nil
}

func (g *Guard) isHostAllowed(host string) bool {
	if len(g.allowedHosts) == 0 {
		return true
	}
	for _, pattern := range g.allowedHosts {
		if strings.HasPrefix(pattern, "*.") {
			if suffix := pattern[1:]; len(host) > len(suffix) && strings.HasSuffix(host, suffix) {
				return true
			}
		} else if host == pattern {
			return true
		}
	}
	return false
}

func (g *Guard) isInAllowedNetworks(ip netip.Addr) bool {
	return containsIP(g.allowedNetworks, ip)
}

func (g *Guard) isInDeniedNetworks(ip netip.Addr) bool {
	return containsIP(g.deniedNetworks, ip)
}

func containsIP(networks []netip.Prefix, ip netip.Addr) bool {
	for _, network := range networks {
		if network.Contains(ip) {
			return true
		}
	}
	return false
}

// embeddedIPv4 returns the IPv4 address embedded in an IPv6 address that is translated to IPv4 by the network.
func embeddedIPv4(ip netip.Addr) (netip.Addr, bool) {
	if !ip.Is6() {
		return netip.Addr{}, false
	}
	b := ip.As16()
	if containsIP(nat64Networks, ip) {
		return netip.AddrFrom4([4]byte(b[12:16])), true
	}
	if sixToFourNetwork.Contains(ip) {
		return netip.AddrFrom4([4]byte(b[2:6])), true
	}
	return netip.Addr{}, false
}

func normalizeHost(host string) string {
	host = strings.ToLower(strings.TrimSuffix(strings.TrimSpace(host), "."))
	if ip, err := netip.ParseAddr(strings.TrimSuffix(strings.TrimPrefix(host, "["), "]")); err == nil {
		return ip.WithZone("").Unmap().String()
	}
	return host
}

// canonicalAddr returns the address (host:port) used by the HTTP transport to connect to a proxy.
func canonicalAddr(u *url.URL) string {
	port := u.Port()
	if len(port) == 0 {
		switch u.Scheme {
		case schemeHTTP:
			port = "80"
		case schemeHTTPS:
			port = "443"
		case "socks5", "socks5h":
			port = "1080"
		}
	}
	return net.JoinHostPort(u.Hostname(), port)
}
