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
	"fmt"
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

// HTTPProxyConfig contains the configuration of the proxy used to forward the requests to the datasources of kind HTTPProxy.
// Each datasource has its own pool of connections, so every limit below applies per datasource.
type HTTPProxyConfig struct {
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
	if c.MaxConnsPerHost < 0 {
		return fmt.Errorf("datasource.http_proxy.max_conns_per_host cannot be negative")
	}
	if c.MaxIdleConns < 0 {
		return fmt.Errorf("datasource.http_proxy.max_idle_conns cannot be negative")
	}
	if c.MaxIdleConns == 0 {
		c.MaxIdleConns = DefaultHTTPProxyMaxIdleConns
	}
	if c.MaxIdleConnsPerHost < 0 {
		return fmt.Errorf("datasource.http_proxy.max_idle_conns_per_host cannot be negative")
	}
	if c.MaxIdleConnsPerHost == 0 {
		c.MaxIdleConnsPerHost = DefaultHTTPProxyMaxIdleConnsPerHost
	}
	if c.DefaultTimeout < 0 {
		return fmt.Errorf("datasource.http_proxy.default_timeout cannot be negative")
	}
	if c.MaxTimeout < 0 {
		return fmt.Errorf("datasource.http_proxy.max_timeout cannot be negative")
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
		return fmt.Errorf("datasource.http_proxy.default_timeout (%s) cannot be greater than datasource.http_proxy.max_timeout (%s)", c.DefaultTimeout, c.MaxTimeout)
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

type DatasourceConfig struct {
	Global  GlobalDatasourceConfig  `json:"global" yaml:"global"`
	Project ProjectDatasourceConfig `json:"project" yaml:"project"`
	// DisableLocal when used is preventing the possibility to add a datasource directly in the dashboard spec.
	// It will also disable the associated proxy.
	DisableLocal bool `json:"disable_local" yaml:"disable_local"`
	// HTTPProxy contains the configuration of the proxy used to forward the requests to the datasources of kind HTTPProxy.
	// +optional
	HTTPProxy HTTPProxyConfig `json:"http_proxy,omitzero" yaml:"http_proxy,omitempty"`
}
