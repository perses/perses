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
//   - A static verification of the URL / host (ValidateURL, ValidateSQLHost, ValidateDatasourceSpec, ValidateOAuth),
//     done when a datasource (or a secret) is saved and before a request is proxied. It provides an early and clear
//     error message.
//   - A verification at connection time (DialContext, DialResolvedContext, HTTPTransport), done on every IP address the
//     destination resolves to, including the ones reached through a redirection. This is the actual protection, as it
//     cannot be bypassed with a DNS name pointing to a forbidden IP address (including DNS rebinding) or with an
//     alternative IP notation.
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
	"syscall"
	"time"
	"unicode/utf8"

	"github.com/perses/perses/pkg/model/api/config"
	datasourcev1 "github.com/perses/perses/pkg/model/api/v1/datasource"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	datasourceSpec "github.com/perses/spec/go/datasource"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	"github.com/sirupsen/logrus"
	"golang.org/x/net/http/httpproxy"
	"golang.org/x/net/idna"
)

const (
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
	defaultAllowedSchemes = []string{config.SchemeHTTP, config.SchemeHTTPS}
	// builtinDeniedNetworks are the networks that are always denied, unless an allowed network at least as specific
	// covers the IP address (see Guard.CheckIP).
	// No datasource is expected to be there, while they give access to sensitive services.
	//
	// The metadata endpoints that are part of a larger denied network are listed individually as well, so they remain
	// denied when the larger network is allowed (e.g. allowing 169.254.0.0/16 doesn't allow 169.254.169.254).
	builtinDeniedNetworks = mustParseNetworks(
		"0.0.0.0/8",          // "this" network. On most systems, 0.0.0.0 reaches the local host.
		"127.0.0.0/8",        // loopback
		"169.254.0.0/16",     // link-local
		"169.254.169.254/32", // metadata endpoint of AWS, GCP, Azure, OpenStack, Oracle, DigitalOcean...
		"169.254.170.2/32",   // AWS ECS task metadata and credentials endpoint
		"169.254.170.23/32",  // AWS EKS Pod Identity credentials endpoint
		"100.100.100.200/32", // Alibaba Cloud metadata endpoint
		"168.63.129.16/32",   // Azure WireServer
		"192.0.0.192/32",     // Oracle Cloud (legacy) metadata endpoint
		"224.0.0.0/4",        // multicast
		"240.0.0.0/4",        // reserved, including the broadcast address
		"::/96",              // unspecified, loopback and deprecated IPv4-compatible addresses
		"fe80::/10",          // link-local
		"ff00::/8",           // multicast
		"fd00:ec2::254/128",  // AWS metadata endpoint (IPv6)
		"fd00:ec2::23/128",   // AWS EKS Pod Identity credentials endpoint (IPv6)
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
)

// Guard verifies that a destination is allowed according to the datasource proxy configuration.
// Use New to create it: the zero value (and a nil *Guard) is not valid.
type Guard struct {
	allowedSchemes  []string
	allowedHosts    []string
	allowedNetworks []netip.Prefix
	deniedNetworks  []netip.Prefix
	resolver        *net.Resolver
}

// New creates a Guard from the datasource proxy configuration.
// The configuration is expected to have been verified beforehand (see config.DatasourceProxyConfig.Verify and
// config.HTTPProxyConfig.Verify), which is the case of the configuration loaded by Perses: its values are valid and normalized.
func New(cfg config.DatasourceProxyConfig) *Guard {
	g := &Guard{
		allowedSchemes:  defaultAllowedSchemes,
		allowedHosts:    slices.Clone(cfg.AllowedHosts),
		allowedNetworks: mustParseNetworks(cfg.AllowedNetworks...),
		deniedNetworks:  append(slices.Clone(builtinDeniedNetworks), mustParseNetworks(cfg.DeniedNetworks...)...),
		resolver:        net.DefaultResolver,
	}
	if len(cfg.HTTP.AllowedSchemes) > 0 {
		g.allowedSchemes = slices.Clone(cfg.HTTP.AllowedSchemes)
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
	return g
}

// mustParseNetworks converts the networks to prefixes.
// It panics if a network is invalid, as the networks are either built-in or coming from a verified configuration.
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

// ValidateDatasourceSpec statically verifies the destination of the proxy defined in the datasource spec, if any.
// It doesn't resolve any DNS name; the resolved IP addresses are verified at connection time.
func (g *Guard) ValidateDatasourceSpec(spec datasourceSpec.Spec) error {
	cfg, kind, err := datasourcev1.ValidateAndExtract(spec.Plugin.Spec)
	if err != nil {
		return err
	}
	return g.ValidateProxyConfig(cfg, kind)
}

// ValidateProxyConfig is the same as ValidateDatasourceSpec, for a proxy config already extracted from the datasource
// spec (see datasourcev1.ValidateAndExtract).
func (g *Guard) ValidateProxyConfig(cfg any, kind string) error {
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
	if u == nil {
		return deny("the url is empty")
	}
	if !slices.Contains(g.allowedSchemes, strings.ToLower(u.Scheme)) {
		return deny("the scheme %q is not allowed, allowed schemes: %s", u.Scheme, strings.Join(g.allowedSchemes, ", "))
	}
	if len(u.Hostname()) == 0 {
		return deny("the url %q doesn't have any host", u.Redacted())
	}
	if u.User != nil {
		// The credentials must be stored in a secret. Besides, "http://allowed.host@evil.host" is a common way to trick
		// a reader (or a naive verification) into believing the URL targets another host.
		return deny("the url %q must not contain credentials (userinfo), use a secret instead", u.Redacted())
	}
	return g.validateHost(u.Hostname())
}

// ValidateOAuth statically verifies that the token URL of the OAuth configuration (of a secret) is allowed.
// A nil configuration is valid.
func (g *Guard) ValidateOAuth(oauth *secretModel.OAuth) error {
	if oauth == nil {
		return nil
	}
	u, err := url.Parse(oauth.TokenURL)
	if err != nil {
		return deny("the OAuth token url is invalid")
	}
	if validateErr := g.ValidateURL(u); validateErr != nil {
		return fmt.Errorf("invalid OAuth token url: %w", validateErr)
	}
	return nil
}

// ValidateSQLHost statically verifies that the host (or the comma-separated list of hosts) of a SQL datasource is allowed.
// A host can contain a port. Unix sockets are not allowed.
func (g *Guard) ValidateSQLHost(hosts string) error {
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
//
// When the IP address is part of both an allowed and a denied network, the most specific network (the longest prefix)
// wins; on equal prefix lengths, the allowed network wins. For example, allowing 10.0.0.0/8 doesn't allow the Kubernetes
// API service IP (denied as a single IP address), while allowing this IP address explicitly does.
//
// When the IP address is not part of any allowed or denied network, the IPv4 address it embeds (NAT64, 6to4), if any,
// is verified the same way.
func (g *Guard) CheckIP(ip netip.Addr) error {
	if !ip.IsValid() {
		return deny("invalid IP address")
	}
	ip = ip.WithZone("").Unmap()
	switch g.verdict(ip) {
	case verdictAllowed:
		return nil
	case verdictDenied:
		return deny("the IP address %s is part of a denied network", ip)
	default:
	}
	if embedded, ok := embeddedIPv4(ip); ok && g.verdict(embedded) == verdictDenied {
		return deny("the IP address %s embeds the IPv4 address %s which is part of a denied network", ip, embedded)
	}
	return nil
}

type verdict int

const (
	verdictNoMatch verdict = iota
	verdictAllowed
	verdictDenied
)

// verdict returns the decision of the most specific network (allowed or denied) containing the IP address.
func (g *Guard) verdict(ip netip.Addr) verdict {
	allowedBits := longestMatch(g.allowedNetworks, ip)
	deniedBits := longestMatch(g.deniedNetworks, ip)
	switch {
	case allowedBits < 0 && deniedBits < 0:
		return verdictNoMatch
	case allowedBits >= deniedBits:
		return verdictAllowed
	default:
		return verdictDenied
	}
}

// DialContext establishes a TCP connection after having verified the destination.
// The host must be part of the allowed hosts (if configured), and the verification is done on each IP address the
// destination resolves to, just before connecting to it.
// It can be used as a dial function for the SQL drivers dialing the hostname (e.g. MySQL).
func (g *Guard) DialContext(ctx context.Context, network, address string) (net.Conn, error) {
	return g.dialContext(ctx, network, address, dialTimeout, true)
}

// LookupHost verifies that the host is allowed (like ValidateSQLHost does) and resolves it.
// It is meant for the drivers resolving the hostname themselves and dialing the resolved IP addresses (e.g. pgx).
// Use it with DialResolvedContext.
func (g *Guard) LookupHost(ctx context.Context, host string) ([]string, error) {
	if err := g.validateHost(host); err != nil {
		return nil, err
	}
	return g.resolver.LookupHost(ctx, host)
}

// DialResolvedContext establishes a TCP connection after having verified the IP address of the destination.
// Unlike DialContext, the host is not verified against the allowed hosts: the address is expected to come from
// LookupHost (where the hostname has been verified) or from an existing connection (e.g. a cancel request).
func (g *Guard) DialResolvedContext(ctx context.Context, network, address string) (net.Conn, error) {
	return g.dialContext(ctx, network, address, dialTimeout, false)
}

// dialContext establishes a TCP connection after having verified the destination, with a custom timeout.
// checkHost defines if the host must be verified against the allowed hosts.
func (g *Guard) dialContext(ctx context.Context, network, address string, timeout time.Duration, checkHost bool) (net.Conn, error) {
	switch network {
	case "tcp", "tcp4", "tcp6":
	default:
		return nil, deny("the network %q is not allowed", network)
	}
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return nil, err
	}
	if checkHost && !g.isHostAllowed(normalizeHost(host)) {
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
// A request targeting the address of the proxy (directly or through it) is denied, as the connections to the proxy
// are not verified.
//
// connectTimeout is the maximum amount of time allowed to establish a connection. When zero or negative, a default of 30s is used.
func (g *Guard) HTTPTransport(tlsConfig *tls.Config, connectTimeout time.Duration) *http.Transport {
	if connectTimeout <= 0 {
		connectTimeout = dialTimeout
	}
	proxyEnv := loadEnvProxy()
	directDialer := &net.Dialer{Timeout: connectTimeout, KeepAlive: dialKeepAlive}
	return &http.Transport{
		Proxy: func(req *http.Request) (*url.URL, error) {
			// The connections to the address of the proxy are not verified (see DialContext below), and the proxy is
			// never a legitimate datasource: reaching it directly would bypass the verification, and reaching it through
			// itself would give access to its own endpoints (e.g. its cache manager).
			if proxyEnv.isProxyAddress(canonicalAddr(req.URL)) {
				return nil, deny("the destination %q is the HTTP proxy of the Perses server", req.URL.Host)
			}
			proxyURL, err := proxyEnv.proxyFunc(req.URL)
			if err != nil {
				return nil, err
			}
			if proxyURL == nil {
				// Direct connection, verified at connection time.
				return nil, nil
			}
			if checkErr := g.checkProxiedDestination(req.Context(), req.URL); checkErr != nil {
				return nil, checkErr
			}
			return proxyURL, nil
		},
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			// The address of the proxy is only dialed for the requests going through the proxy,
			// as the direct requests to this address are denied by the Proxy function above.
			if proxyEnv.isProxyAddress(address) {
				return directDialer.DialContext(ctx, network, address)
			}
			return g.dialContext(ctx, network, address, connectTimeout, true)
		},
		TLSHandshakeTimeout: 10 * time.Second,
		IdleConnTimeout:     90 * time.Second,
		ForceAttemptHTTP2:   true,
		TLSClientConfig:     tlsConfig,
	}
}

// envProxy is the HTTP proxy configuration read from the environment (HTTP_PROXY, HTTPS_PROXY, NO_PROXY).
type envProxy struct {
	proxyFunc func(*url.URL) (*url.URL, error)
	// addresses are the normalized addresses (see normalizeAddr) used to connect to the proxies.
	addresses map[string]struct{}
}

func loadEnvProxy() envProxy {
	cfg := httpproxy.FromEnvironment()
	addresses := make(map[string]struct{})
	for _, rawProxy := range []string{cfg.HTTPProxy, cfg.HTTPSProxy} {
		if proxyURL := parseProxyURL(rawProxy); proxyURL != nil {
			addresses[normalizeAddr(canonicalAddr(proxyURL))] = struct{}{}
		}
	}
	return envProxy{proxyFunc: cfg.ProxyFunc(), addresses: addresses}
}

func (e envProxy) isProxyAddress(address string) bool {
	if len(e.addresses) == 0 {
		return false
	}
	_, ok := e.addresses[normalizeAddr(address)]
	return ok
}

// parseProxyURL parses the proxy URL the same way httpproxy does.
// If the result were to differ, the connections to the proxy would be verified like any other connection (safe side).
func parseProxyURL(rawProxy string) *url.URL {
	if len(rawProxy) == 0 {
		return nil
	}
	proxyURL, err := url.Parse(rawProxy)
	if err != nil || len(proxyURL.Scheme) == 0 || len(proxyURL.Host) == 0 {
		// Like httpproxy, try again with the http scheme (e.g. "proxy:3128").
		if proxyURL, err = url.Parse("http://" + rawProxy); err != nil {
			return nil
		}
	}
	return proxyURL
}

// checkProxiedDestination verifies a destination that will be reached through an HTTP proxy.
// The connection is established with the proxy, so the final destination cannot be verified at connection time.
//
// The verification is best effort: the proxy resolves the name on its own and could get a different result.
// The allowed_hosts configuration, or a policy enforced by the proxy itself, is the way to strictly restrict the
// destinations in this situation.
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
		// The name might only be resolvable by the proxy (split DNS). The static verification passed (in particular,
		// the host is not an IPv4 address in a non-canonical notation that the proxy would translate on its own, see
		// endsInNumber), so let the proxy handle it.
		logrus.WithError(err).WithField("host", host).Debug("unable to resolve the destination before sending the request to the HTTP proxy, the proxy will resolve it")
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
	if endsInNumber(host) {
		return deny("the host %q is an IPv4 address in a non-canonical notation, use the dotted-decimal notation instead (e.g. 10.0.0.1)", host)
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

// longestMatch returns the length of the longest prefix containing the IP address, or -1 if none contains it.
func longestMatch(networks []netip.Prefix, ip netip.Addr) int {
	longest := -1
	for _, network := range networks {
		if network.Bits() > longest && network.Contains(ip) {
			longest = network.Bits()
		}
	}
	return longest
}

func containsIP(networks []netip.Prefix, ip netip.Addr) bool {
	return longestMatch(networks, ip) >= 0
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

// endsInNumber returns true if the last label of the (normalized) host is a number, in decimal or in hexadecimal
// with the "0x" prefix (see the "ends in a number checker" of the WHATWG URL standard).
//
// Such a host is not a valid DNS name, as no top-level domain is numeric: it's an IPv4 address in a non-canonical
// notation (e.g. "2130706433", "0x7f000001", "127.1" or "0177.0.0.1" for 127.0.0.1). These notations are rejected by
// netip.ParseAddr and by the Go resolver, but translated to an IP address by inet_aton / getaddrinfo, and so by
// most HTTP proxies and browsers. They would bypass the verification of the destinations resolved by an HTTP proxy.
func endsInNumber(host string) bool {
	labels := strings.Split(host, ".")
	last := labels[len(labels)-1]
	if len(last) == 0 && len(labels) > 1 {
		last = labels[len(labels)-2]
	}
	if len(last) == 0 {
		return false
	}
	if isDigits(last) {
		return true
	}
	if hexDigits, ok := strings.CutPrefix(last, "0x"); ok {
		return isHexDigits(hexDigits)
	}
	return false
}

func isDigits(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return false
		}
	}
	return true
}

// isHexDigits returns true if s only contains hexadecimal digits (lowercase, as the host is normalized).
// An empty string is accepted, as "0x" alone is the number zero for inet_aton.
func isHexDigits(s string) bool {
	for i := 0; i < len(s); i++ {
		if (s[i] < '0' || s[i] > '9') && (s[i] < 'a' || s[i] > 'f') {
			return false
		}
	}
	return true
}

func normalizeHost(host string) string {
	host = strings.ToLower(strings.TrimSuffix(strings.TrimSpace(host), "."))
	if ip, err := netip.ParseAddr(strings.TrimSuffix(strings.TrimPrefix(host, "["), "]")); err == nil {
		return ip.WithZone("").Unmap().String()
	}
	return host
}

// canonicalAddr returns the address (host:port) used by the HTTP transport to connect to the URL (or to the proxy).
func canonicalAddr(u *url.URL) string {
	port := u.Port()
	if len(port) == 0 {
		switch u.Scheme {
		case config.SchemeHTTP:
			port = "80"
		case config.SchemeHTTPS:
			port = "443"
		case "socks5", "socks5h":
			port = "1080"
		}
	}
	return net.JoinHostPort(u.Hostname(), port)
}

// normalizeAddr normalizes an address (host:port), so the different notations of the same address are equal
// (case, trailing dot, internationalized domain name, IP notation).
func normalizeAddr(address string) string {
	host, port, err := net.SplitHostPort(address)
	if err != nil {
		return strings.ToLower(address)
	}
	host = normalizeHost(host)
	if !isASCII(host) {
		if asciiHost, idnaErr := idna.Lookup.ToASCII(host); idnaErr == nil {
			host = asciiHost
		}
	}
	return net.JoinHostPort(host, port)
}

func isASCII(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] >= utf8.RuneSelf {
			return false
		}
	}
	return true
}
