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
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/labstack/echo/v4"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
)

// benchResponseBody is ~2KB, the order of magnitude of a small Prometheus query response.
var benchResponseBody = []byte(`{"status":"success","data":{"resultType":"vector","result":[` +
	strings.Repeat(`{"metric":{"__name__":"up","job":"prometheus"},"value":[1700000000,"1"]},`, 25) + `{}]}}`)

// newBenchServer starts a fake datasource and returns a counter of the connections it accepted.
func newBenchServer(tlsEnabled, keepAlive bool) (*httptest.Server, *atomic.Int64) {
	newConns := &atomic.Int64{}
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(benchResponseBody)
	}))
	server.Config.ConnState = func(_ net.Conn, state http.ConnState) {
		if state == http.StateNew {
			newConns.Add(1)
		}
	}
	server.Config.SetKeepAlivesEnabled(keepAlive)
	// When the server is closed at the end of a run, the transport may still be dialing connections in the background.
	// The resulting handshake errors are expected and would only pollute the benchmark output.
	server.Config.ErrorLog = log.New(io.Discard, "", 0)
	if tlsEnabled {
		server.StartTLS()
	} else {
		server.Start()
	}
	return server, newConns
}

func closeCachedTransports(cache *transportCache) {
	for _, e := range cache.entries {
		e.transport.CloseIdleConnections()
	}
}

func newBenchSecret(server *httptest.Server, tlsEnabled bool) *v1.SecretSpec {
	if !tlsEnabled {
		return nil
	}
	caPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw})
	return &v1.SecretSpec{TLSConfig: &secretModel.TLSConfig{CA: string(caPEM), MinVersion: "TLS12", MaxVersion: "TLS13"}}
}

func benchServeOnce(e *echo.Echo, server *httptest.Server, secret *v1.SecretSpec, cache *transportCache, transportKey string) error {
	// A new httpProxy is created for each request, like newProxy does.
	h := &httpProxy{
		config:       &datasourceHTTP.Config{URL: common.MustParseURL(server.URL)},
		path:         "/api/v1/query",
		secret:       secret,
		transports:   cache,
		transportKey: transportKey,
	}
	req := httptest.NewRequest(http.MethodGet, "http://perses.example.com/proxy/globaldatasources/prometheus/api/v1/query", nil)
	rec := httptest.NewRecorder()
	if err := h.serve(e.NewContext(req, rec)); err != nil {
		return err
	}
	if rec.Code != http.StatusOK {
		return fmt.Errorf("unexpected status code %d", rec.Code)
	}
	return nil
}

// BenchmarkHTTPProxy_serve compares the cost of proxying a request when a new transport is created for each request
// (what happens for an unsaved datasource, and what used to happen for every datasource)
// with the cost when the transport of the datasource is cached.
//
// The fake datasource runs on the loopback interface, so the network round trips saved by reusing the connections
// (TCP handshake + TLS handshake) are close to zero here. On a real network, the gain per request is higher.
//
//	go test ./internal/api/impl/proxy/ -run '^$' -bench BenchmarkHTTPProxy_serve
func BenchmarkHTTPProxy_serve(b *testing.B) {
	for _, scheme := range []struct {
		name string
		tls  bool
	}{
		{name: "http", tls: false},
		{name: "https", tls: true},
	} {
		for _, mode := range []struct {
			name         string
			transportKey string
		}{
			{name: "new-transport-per-request", transportKey: ""},
			{name: "cached-transport", transportKey: globalTransportKey("prometheus")},
		} {
			// When a new transport is created for each request, the connection is never reused.
			// Without keep-alive, the server closes it after the response.
			// Otherwise, the connections would pile up (until IdleConnTimeout) and could exhaust the file descriptors
			// or the ephemeral ports during the benchmark. The cost of the handshakes is measured the same way.
			keepAlive := len(mode.transportKey) > 0

			b.Run(scheme.name+"/"+mode.name+"/sequential", func(b *testing.B) {
				server, newConns := newBenchServer(scheme.tls, keepAlive)
				defer server.Close()
				secret := newBenchSecret(server, scheme.tls)
				cache := newTransportCache()
				defer closeCachedTransports(cache)
				e := echo.New()
				iterations := 0
				b.ReportAllocs()
				for b.Loop() {
					if err := benchServeOnce(e, server, secret, cache, mode.transportKey); err != nil {
						b.Fatal(err)
					}
					iterations++
				}
				b.ReportMetric(float64(newConns.Load())/float64(iterations), "conns/op")
			})

			b.Run(scheme.name+"/"+mode.name+"/parallel", func(b *testing.B) {
				server, newConns := newBenchServer(scheme.tls, keepAlive)
				defer server.Close()
				secret := newBenchSecret(server, scheme.tls)
				cache := newTransportCache()
				defer closeCachedTransports(cache)
				e := echo.New()
				var iterations atomic.Int64
				b.ReportAllocs()
				b.RunParallel(func(pb *testing.PB) {
					for pb.Next() {
						if err := benchServeOnce(e, server, secret, cache, mode.transportKey); err != nil {
							b.Error(err)
							return
						}
						iterations.Add(1)
					}
				})
				b.ReportMetric(float64(newConns.Load())/float64(iterations.Load()), "conns/op")
			})
		}
	}
}
