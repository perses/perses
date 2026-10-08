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

package httpproxy

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"io"
	"log"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeClock struct {
	current time.Time
}

func (f *fakeClock) now() time.Time {
	return f.current
}

func (f *fakeClock) advance(d time.Duration) {
	f.current = f.current.Add(d)
}

func newTestTransportCache() (*TransportCache, *fakeClock) {
	clock := &fakeClock{current: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)}
	c := NewTransportCache()
	c.now = clock.now
	return c, clock
}

// countingBuilder returns a build function creating a new transport on each call and counting the calls.
func countingBuilder(counter *int) func() (*http.Transport, error) {
	return func() (*http.Transport, error) {
		*counter++
		return &http.Transport{}, nil
	}
}

// failingBuilder returns a build function always failing and counting the calls.
func failingBuilder(counter *int) func() (*http.Transport, error) {
	return func() (*http.Transport, error) {
		*counter++
		return nil, assert.AnError
	}
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	require.NoError(t, os.WriteFile(path, []byte(content), 0o600))
}

func TestTransportCache_get(t *testing.T) {
	tlsA := &secretModel.TLSConfig{CA: "ca-a", MinVersion: "TLS12"}
	tlsB := &secretModel.TLSConfig{CA: "ca-b", MinVersion: "TLS12"}

	t.Run("reuse the transport for the same datasource and TLS config", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", transportSettings{TLSConfig: &secretModel.TLSConfig{CA: "ca-a", MinVersion: "TLS12"}}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, builds)
	})

	t.Run("reuse the transport when there is no TLS config", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", transportSettings{}, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", transportSettings{}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, builds)
	})

	t.Run("rebuild the transport when the TLS config changes", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsB}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
		// Only the latest version is kept for a given datasource.
		assert.Len(t, c.entries, 1)
	})

	t.Run("rebuild the transport when the connect timeout changes", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsA, ConnectTimeout: 30 * time.Second}, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsA, ConnectTimeout: 30 * time.Second}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		t3, err := c.get("global/a", transportSettings{TLSConfig: tlsA, ConnectTimeout: 10 * time.Second}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t3)
		assert.Equal(t, 2, builds)
		// Only the latest version is kept for a given datasource.
		assert.Len(t, c.entries, 1)
	})

	t.Run("do not share the transport between datasources", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("project/p/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("dashboard/p/d/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
	})

	t.Run("rebuild the transport once expired", func(t *testing.T) {
		c, clock := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		clock.advance(transportMaxLifetime - time.Second)
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		clock.advance(time.Second)
		t3, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t3)
		assert.Equal(t, 2, builds)
	})

	t.Run("remove the expired transports", func(t *testing.T) {
		c, clock := newTestTransportCache()
		builds := 0
		_, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		clock.advance(transportMaxLifetime)
		_, err = c.get("global/b", transportSettings{TLSConfig: tlsA}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotContains(t, c.entries, "global/a")
		assert.Contains(t, c.entries, "global/b")
	})

	t.Run("do not cache when the build fails", func(t *testing.T) {
		c, _ := newTestTransportCache()
		_, err := c.get("global/a", transportSettings{TLSConfig: tlsA}, func() (*http.Transport, error) {
			return nil, assert.AnError
		})
		require.ErrorIs(t, err, assert.AnError)
		assert.Empty(t, c.entries)
	})
}

func TestTransportCache_get_caFile(t *testing.T) {
	newCAFile := func(t *testing.T, content string) (string, *secretModel.TLSConfig) {
		path := filepath.Join(t.TempDir(), "ca.crt")
		writeFile(t, path, content)
		return path, &secretModel.TLSConfig{CAFile: path, MinVersion: "TLS12"}
	}

	t.Run("reuse the transport when the CA file doesn't change", func(t *testing.T) {
		c, _ := newTestTransportCache()
		_, tlsConfig := newCAFile(t, "ca-v1")
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, builds)
	})

	t.Run("rebuild the transport when the CA file content changes", func(t *testing.T) {
		c, _ := newTestTransportCache()
		path, tlsConfig := newCAFile(t, "ca-v1")
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		writeFile(t, path, "ca-version-2")
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
	})

	t.Run("rebuild the transport when only the modification time of the CA file changes", func(t *testing.T) {
		c, _ := newTestTransportCache()
		path, tlsConfig := newCAFile(t, "ca-v1")
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		// Same size, different modification time.
		future := time.Now().Add(time.Hour)
		require.NoError(t, os.Chtimes(path, future, future))
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
	})

	t.Run("rebuild the transport when a Kubernetes secret mounted as volume is updated", func(t *testing.T) {
		// Reproduce the layout created by the kubelet:
		//   ca.crt -> ..data/ca.crt
		//   ..data -> ..2026_01_01_00_00_00.1   (swapped atomically to a new directory on update)
		dir := t.TempDir()
		v1Dir := filepath.Join(dir, "..2026_01_01_00_00_00.1")
		v2Dir := filepath.Join(dir, "..2026_01_01_00_05_00.2")
		require.NoError(t, os.Mkdir(v1Dir, 0o700))
		require.NoError(t, os.Mkdir(v2Dir, 0o700))
		writeFile(t, filepath.Join(v1Dir, "ca.crt"), "ca-v1")
		writeFile(t, filepath.Join(v2Dir, "ca.crt"), "ca-version-2")
		require.NoError(t, os.Symlink(filepath.Base(v1Dir), filepath.Join(dir, "..data")))
		require.NoError(t, os.Symlink(filepath.Join("..data", "ca.crt"), filepath.Join(dir, "ca.crt")))
		tlsConfig := &secretModel.TLSConfig{CAFile: filepath.Join(dir, "ca.crt"), MinVersion: "TLS12"}

		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		// Swap the "..data" symlink like the kubelet does (see AtomicWriter in kubernetes/pkg/volume/util/atomic_writer.go).
		dataDir := filepath.Join(dir, "..data")
		if runtime.GOOS == "windows" {
			// On Windows, a symlink to a directory cannot be replaced by a rename ("Access is denied"),
			// so the kubelet removes it and creates it again.
			require.NoError(t, os.Remove(dataDir))
			require.NoError(t, os.Symlink(filepath.Base(v2Dir), dataDir))
		} else {
			// Elsewhere, the symlink is swapped atomically.
			require.NoError(t, os.Symlink(filepath.Base(v2Dir), filepath.Join(dir, "..data_tmp")))
			require.NoError(t, os.Rename(filepath.Join(dir, "..data_tmp"), dataDir))
		}
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
	})

	t.Run("reuse the transport when the CA file cannot be stat'ed", func(t *testing.T) {
		c, _ := newTestTransportCache()
		path, tlsConfig := newCAFile(t, "ca-v1")
		builds := 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		require.NoError(t, os.Remove(path))
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, builds)
	})

	t.Run("keep the previous transport while the rebuild fails, during the grace period", func(t *testing.T) {
		c, clock := newTestTransportCache()
		path, tlsConfig := newCAFile(t, "ca-v1")
		builds, failedBuilds := 0, 0
		t1, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)

		// The CA file is being rewritten, the new transport cannot be built: the previous one is used.
		writeFile(t, path, "ca-being-rewritten")
		t2, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, failingBuilder(&failedBuilds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, failedBuilds)

		// No new attempt before the retry interval.
		clock.advance(transportRebuildRetryInterval - time.Second)
		t3, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, failingBuilder(&failedBuilds))
		require.NoError(t, err)
		assert.Same(t, t1, t3)
		assert.Equal(t, 1, failedBuilds)

		// New attempt after the retry interval, still failing.
		clock.advance(time.Second)
		t4, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, failingBuilder(&failedBuilds))
		require.NoError(t, err)
		assert.Same(t, t1, t4)
		assert.Equal(t, 2, failedBuilds)

		// Once the file is valid again, the new transport is built and used.
		clock.advance(transportRebuildRetryInterval)
		t5, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t5)
		assert.Equal(t, 2, builds)
		assert.True(t, c.entries["global/a"].failedSince.IsZero())
	})

	t.Run("return the error when the rebuild still fails after the grace period", func(t *testing.T) {
		c, clock := newTestTransportCache()
		path, tlsConfig := newCAFile(t, "ca-v1")
		builds, failedBuilds := 0, 0
		_, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		writeFile(t, path, "invalid-ca-file")
		_, err = c.get("global/a", transportSettings{TLSConfig: tlsConfig}, failingBuilder(&failedBuilds))
		require.NoError(t, err)

		clock.advance(transportRebuildGracePeriod)
		_, err = c.get("global/a", transportSettings{TLSConfig: tlsConfig}, failingBuilder(&failedBuilds))
		require.ErrorIs(t, err, assert.AnError)
		assert.Equal(t, 2, failedBuilds)
	})

	t.Run("do not fall back to the previous transport when the TLS config changed", func(t *testing.T) {
		c, _ := newTestTransportCache()
		_, tlsConfig := newCAFile(t, "ca-v1")
		builds, failedBuilds := 0, 0
		_, err := c.get("global/a", transportSettings{TLSConfig: tlsConfig}, countingBuilder(&builds))
		require.NoError(t, err)
		otherConfig := &secretModel.TLSConfig{CAFile: tlsConfig.CAFile, MinVersion: "TLS13"}
		_, err = c.get("global/a", transportSettings{TLSConfig: otherConfig}, failingBuilder(&failedBuilds))
		require.ErrorIs(t, err, assert.AnError)
	})
}

// TestHTTPProxy_serve_reusesConnections ensures the connections to a saved datasource are reused across requests,
// while an unsaved datasource (no transport key) opens a new connection for each request.
func TestHTTPProxy_serve_reusesConnections(t *testing.T) {
	var newConns atomic.Int32
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success"}`))
	}))
	server.Config.ConnState = func(_ net.Conn, state http.ConnState) {
		if state == http.StateNew {
			newConns.Add(1)
		}
	}
	server.Start()
	defer server.Close()

	const nbRequests = 5
	for _, test := range []struct {
		name          string
		transportKey  string
		expectedConns int32
	}{
		{name: "saved datasource", transportKey: "global/prometheus", expectedConns: 1},
		{name: "unsaved datasource", transportKey: "", expectedConns: nbRequests},
	} {
		t.Run(test.name, func(t *testing.T) {
			newConns.Store(0)
			cache := NewTransportCache()
			for range nbRequests {
				// A new Proxy is created for each request, like newProxy does.
				h := &Proxy{
					Config:       &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
					Path:         "/api/v1/query",
					Transports:   cache,
					Guard:        proxytest.NewLoopbackGuard(t),
					TransportKey: test.transportKey,
				}
				req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prometheus/api/v1/query", nil)
				rec := httptest.NewRecorder()
				require.NoError(t, h.Serve(echo.New().NewContext(req, rec)))
				require.Equal(t, http.StatusOK, rec.Code)
			}
			assert.Equal(t, test.expectedConns, newConns.Load())
			for _, e := range cache.entries {
				e.transport.CloseIdleConnections()
			}
		})
	}
}

// TestHTTPProxy_getTransport_connectionLimits ensures the limits set in the config (datasource.proxy.http)
// are applied to the transport, and that the unset ones fall back to their defaults.
// Passing the config from the endpoint to the proxy is covered by TestEndpoint_newProxy_connectionLimits (proxy package).
func TestHTTPProxy_getTransport_connectionLimits(t *testing.T) {
	custom := config.HTTPProxyConfig{MaxConnsPerHost: 3, MaxIdleConns: 20, MaxIdleConnsPerHost: 2}
	for _, test := range []struct {
		name         string
		proxyConfig  config.HTTPProxyConfig
		transportKey string
		expected     config.HTTPProxyConfig
	}{
		{
			name:         "defaults",
			transportKey: "global/prometheus",
			expected: config.HTTPProxyConfig{
				MaxConnsPerHost:     0,
				MaxIdleConns:        config.DefaultHTTPProxyMaxIdleConns,
				MaxIdleConnsPerHost: config.DefaultHTTPProxyMaxIdleConnsPerHost,
			},
		},
		{name: "limits applied to a saved datasource", proxyConfig: custom, transportKey: "global/prometheus", expected: custom},
		{name: "limits applied to an unsaved datasource", proxyConfig: custom, transportKey: "", expected: custom},
	} {
		t.Run(test.name, func(t *testing.T) {
			// The config is verified when Perses loads it, which also sets the default values.
			proxyConfig := test.proxyConfig
			require.NoError(t, proxyConfig.Verify())
			h := &Proxy{
				Config:       &datasourceHTTP.Config{URL: common.MustParseURL("http://localhost:9090")},
				Path:         "/api/v1/query",
				Transports:   NewTransportCache(),
				Guard:        proxytest.NewLoopbackGuard(t),
				TransportKey: test.transportKey,
				ProxyConfig:  proxyConfig,
			}
			transport, err := h.getTransport()
			require.NoError(t, err)
			assert.Equal(t, test.expected.MaxConnsPerHost, transport.MaxConnsPerHost)
			assert.Equal(t, test.expected.MaxIdleConns, transport.MaxIdleConns)
			assert.Equal(t, test.expected.MaxIdleConnsPerHost, transport.MaxIdleConnsPerHost)
		})
	}
}

// TestHTTPProxy_getTransport_timeoutChange ensures the cached transport of a saved datasource is rebuilt when its
// effective timeout changes, so the new timeout applies right away instead of once the cached transport expires.
func TestHTTPProxy_getTransport_timeoutChange(t *testing.T) {
	cache := NewTransportCache()
	newHTTPProxy := func(timeout common.DurationString) *Proxy {
		return &Proxy{
			Config:       &datasourceHTTP.Config{URL: common.MustParseURL("http://localhost:9090"), Timeout: timeout},
			Path:         "/api/v1/query",
			Transports:   cache,
			Guard:        proxytest.NewLoopbackGuard(t),
			TransportKey: "global/prometheus",
			ProxyConfig:  config.HTTPProxyConfig{DefaultTimeout: common.Duration(10 * time.Second), MaxTimeout: common.Duration(time.Minute)},
		}
	}
	t1, err := newHTTPProxy("20s").getTransport()
	require.NoError(t, err)
	t2, err := newHTTPProxy("20s").getTransport()
	require.NoError(t, err)
	assert.Same(t, t1, t2)

	// The timeout of the datasource has been updated.
	t3, err := newHTTPProxy("30s").getTransport()
	require.NoError(t, err)
	assert.NotSame(t, t2, t3)

	// Both timeouts are beyond the maximum and so clamped to the same value: the transport is reused.
	t4, err := newHTTPProxy("5m").getTransport()
	require.NoError(t, err)
	assert.NotSame(t, t3, t4)
	t5, err := newHTTPProxy("10m").getTransport()
	require.NoError(t, err)
	assert.Same(t, t4, t5)
	assert.Len(t, cache.entries, 1)
}

// TestHTTPProxy_serve_maxConnsPerHost ensures concurrent requests beyond the limit wait for a connection
// instead of opening new ones.
func TestHTTPProxy_serve_maxConnsPerHost(t *testing.T) {
	var newConns, inFlight, maxInFlight atomic.Int32
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		current := inFlight.Add(1)
		defer inFlight.Add(-1)
		for {
			previous := maxInFlight.Load()
			if current <= previous || maxInFlight.CompareAndSwap(previous, current) {
				break
			}
		}
		time.Sleep(20 * time.Millisecond)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success"}`))
	}))
	server.Config.ConnState = func(_ net.Conn, state http.ConnState) {
		if state == http.StateNew {
			newConns.Add(1)
		}
	}
	server.Start()
	defer server.Close()

	const nbRequests = 5
	cache := NewTransportCache()
	var wg sync.WaitGroup
	for range nbRequests {
		wg.Go(func() {
			h := &Proxy{
				Config:       &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
				Path:         "/api/v1/query",
				Transports:   cache,
				Guard:        proxytest.NewLoopbackGuard(t),
				TransportKey: "global/prometheus",
				ProxyConfig:  config.HTTPProxyConfig{MaxConnsPerHost: 1},
			}
			req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prometheus/api/v1/query", nil)
			rec := httptest.NewRecorder()
			assert.NoError(t, h.Serve(echo.New().NewContext(req, rec)))
			assert.Equal(t, http.StatusOK, rec.Code)
		})
	}
	wg.Wait()

	assert.Equal(t, int32(1), newConns.Load())
	assert.Equal(t, int32(1), maxInFlight.Load())
	for _, e := range cache.entries {
		e.transport.CloseIdleConnections()
	}
}

// TestHTTPProxy_serve_maxIdleConnsPerHost ensures that, once a burst of requests is over,
// the number of connections kept open for a datasource is bounded by max_idle_conns_per_host.
func TestHTTPProxy_serve_maxIdleConnsPerHost(t *testing.T) {
	const nbRequests = 5
	var newConns, openConns atomic.Int32
	var arrived sync.WaitGroup
	arrived.Add(nbRequests)
	allArrived := make(chan struct{})
	go func() {
		arrived.Wait()
		close(allArrived)
	}()
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		// Hold every request until all of them are in flight, so each one needs its own connection.
		arrived.Done()
		select {
		case <-allArrived:
		case <-time.After(5 * time.Second):
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success"}`))
	}))
	server.Config.ConnState = func(_ net.Conn, state http.ConnState) {
		switch state {
		case http.StateNew:
			newConns.Add(1)
			openConns.Add(1)
		case http.StateClosed, http.StateHijacked:
			openConns.Add(-1)
		}
	}
	server.Start()
	defer server.Close()

	cache := NewTransportCache()
	var wg sync.WaitGroup
	for range nbRequests {
		wg.Go(func() {
			h := &Proxy{
				Config:       &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
				Path:         "/api/v1/query",
				Transports:   cache,
				Guard:        proxytest.NewLoopbackGuard(t),
				TransportKey: "global/prometheus",
				ProxyConfig:  config.HTTPProxyConfig{MaxIdleConnsPerHost: 1},
			}
			req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prometheus/api/v1/query", nil)
			rec := httptest.NewRecorder()
			assert.NoError(t, h.Serve(echo.New().NewContext(req, rec)))
			assert.Equal(t, http.StatusOK, rec.Code)
		})
	}
	wg.Wait()

	// The burst needed one connection per request, but only one of them is kept idle afterward.
	assert.Equal(t, int32(nbRequests), newConns.Load())
	assert.Eventually(t, func() bool { return openConns.Load() == 1 }, 2*time.Second, 10*time.Millisecond)
	for _, e := range cache.entries {
		e.transport.CloseIdleConnections()
	}
}

// newSelfSignedCert generates a self-signed certificate for 127.0.0.1, acting as its own CA.
// It returns the certificate to be served and its PEM encoding to be trusted.
func newSelfSignedCert(t *testing.T, commonName string) (tls.Certificate, []byte) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	template := &x509.Certificate{
		SerialNumber:          big.NewInt(time.Now().UnixNano()),
		Subject:               pkix.Name{CommonName: commonName},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(time.Hour),
		IsCA:                  true,
		BasicConstraintsValid: true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:           []net.IP{net.ParseIP("127.0.0.1")},
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	require.NoError(t, err)
	return tls.Certificate{Certificate: [][]byte{der}, PrivateKey: key}, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
}

// TestHTTPProxy_serve_caFileRotation ensures that when the CA file referenced by the secret is updated on disk,
// the next request uses the new CA, without waiting for the cached transport to expire.
func TestHTTPProxy_serve_caFileRotation(t *testing.T) {
	_, oldCAPEM := newSelfSignedCert(t, "old-ca")
	newCert, newCAPEM := newSelfSignedCert(t, "new-ca")

	// The datasource already serves a certificate issued by the new CA, while Perses still trusts the old one.
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"success"}`))
	}))
	server.TLS = &tls.Config{Certificates: []tls.Certificate{newCert}, MinVersion: tls.VersionTLS12}
	// The handshake failures are expected, don't pollute the test output.
	server.Config.ErrorLog = log.New(io.Discard, "", 0)
	server.StartTLS()
	defer server.Close()

	caFile := filepath.Join(t.TempDir(), "ca.crt")
	require.NoError(t, os.WriteFile(caFile, oldCAPEM, 0o600))
	cache := NewTransportCache()
	defer closeCachedTransports(cache)
	serve := func() (int, error) {
		h := &Proxy{
			Config:       &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
			Path:         "/api/v1/query",
			Secret:       &v1.SecretSpec{TLSConfig: &secretModel.TLSConfig{CAFile: caFile, MinVersion: "TLS12"}},
			Transports:   cache,
			Guard:        proxytest.NewLoopbackGuard(t),
			TransportKey: "global/prometheus",
		}
		req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prometheus/api/v1/query", nil)
		rec := httptest.NewRecorder()
		err := h.Serve(echo.New().NewContext(req, rec))
		return rec.Code, err
	}

	// The certificate of the datasource is not trusted yet.
	_, err := serve()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unknown authority")

	// The CA file is updated on disk, the next request must use it.
	require.NoError(t, os.WriteFile(caFile, newCAPEM, 0o600))
	// Make sure the modification time changes, even on file systems with a coarse timestamp resolution.
	future := time.Now().Add(time.Minute)
	require.NoError(t, os.Chtimes(caFile, future, future))
	code, err := serve()
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, code)
}
