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
	"net"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
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

func newTestTransportCache() (*transportCache, *fakeClock) {
	clock := &fakeClock{current: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)}
	c := newTransportCache()
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

func TestTransportCache_get(t *testing.T) {
	tlsA := &secretModel.TLSConfig{CA: "ca-a", MinVersion: "TLS12"}
	tlsB := &secretModel.TLSConfig{CA: "ca-b", MinVersion: "TLS12"}

	t.Run("reuse the transport for the same datasource and TLS config", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", &secretModel.TLSConfig{CA: "ca-a", MinVersion: "TLS12"}, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, builds)
	})

	t.Run("reuse the transport when there is no TLS config", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", nil, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", nil, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		assert.Equal(t, 1, builds)
	})

	t.Run("rebuild the transport when the TLS config changes", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get("global/a", tlsB, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
		// Only the latest version is kept for a given datasource.
		assert.Len(t, c.entries, 1)
	})

	t.Run("do not share the transport between datasources", func(t *testing.T) {
		c, _ := newTestTransportCache()
		builds := 0
		t1, err := c.get(projectTransportKey("p", "a"), tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		t2, err := c.get(dashboardTransportKey("p", "d", "a"), tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t2)
		assert.Equal(t, 2, builds)
	})

	t.Run("rebuild the transport once expired", func(t *testing.T) {
		c, clock := newTestTransportCache()
		builds := 0
		t1, err := c.get("global/a", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		clock.advance(transportMaxLifetime - time.Second)
		t2, err := c.get("global/a", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		assert.Same(t, t1, t2)
		clock.advance(time.Second)
		t3, err := c.get("global/a", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotSame(t, t1, t3)
		assert.Equal(t, 2, builds)
	})

	t.Run("remove the expired transports", func(t *testing.T) {
		c, clock := newTestTransportCache()
		builds := 0
		_, err := c.get("global/a", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		clock.advance(transportMaxLifetime)
		_, err = c.get("global/b", tlsA, countingBuilder(&builds))
		require.NoError(t, err)
		assert.NotContains(t, c.entries, "global/a")
		assert.Contains(t, c.entries, "global/b")
	})

	t.Run("do not cache when the build fails", func(t *testing.T) {
		c, _ := newTestTransportCache()
		_, err := c.get("global/a", tlsA, func() (*http.Transport, error) {
			return nil, assert.AnError
		})
		require.ErrorIs(t, err, assert.AnError)
		assert.Empty(t, c.entries)
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
		{name: "saved datasource", transportKey: globalTransportKey("prometheus"), expectedConns: 1},
		{name: "unsaved datasource", transportKey: "", expectedConns: nbRequests},
	} {
		t.Run(test.name, func(t *testing.T) {
			newConns.Store(0)
			cache := newTransportCache()
			for range nbRequests {
				// A new httpProxy is created for each request, like newProxy does.
				h := &httpProxy{
					config:       &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
					path:         "/api/v1/query",
					transports:   cache,
					transportKey: test.transportKey,
				}
				req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prometheus/api/v1/query", nil)
				rec := httptest.NewRecorder()
				require.NoError(t, h.serve(echo.New().NewContext(req, rec)))
				require.Equal(t, http.StatusOK, rec.Code)
			}
			assert.Equal(t, test.expectedConns, newConns.Load())
			for _, e := range cache.entries {
				e.transport.CloseIdleConnections()
			}
		})
	}
}
