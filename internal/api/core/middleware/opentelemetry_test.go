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

package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

// newTracedServer returns an echo server using the OpenTelemetry middleware with the given configuration,
// and the recorder of the spans it creates.
func newTracedServer(t *testing.T, config OpenTelemetryConfig) (*echo.Echo, *tracetest.SpanRecorder) {
	t.Helper()
	recorder := tracetest.NewSpanRecorder()
	provider := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(recorder))
	t.Cleanup(func() { _ = provider.Shutdown(context.Background()) })
	config.TracerProvider = provider

	e := echo.New()
	// As in perses/common, the Recover middleware runs before the OpenTelemetry one.
	e.Use(echoMiddleware.Recover(), OpenTelemetryWithConfig(config))
	e.GET("/api/v1/projects/:project", func(c *echo.Context) error { return c.NoContent(http.StatusOK) })
	e.GET("/api/v1/broken", func(_ *echo.Context) error { return echo.NewHTTPError(http.StatusBadGateway, "broken") })
	e.GET("/api/v1/panic", func(_ *echo.Context) error { panic("boom") })
	e.GET("/api/v1/health", func(c *echo.Context) error { return c.NoContent(http.StatusOK) })
	e.GET("/metrics", func(c *echo.Context) error { return c.NoContent(http.StatusOK) })
	return e, recorder
}

func TestOpenTelemetry(t *testing.T) {
	t.Run("span is named after the route", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/projects/perses", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Equal(t, "GET /api/v1/projects/:project", spans[0].Name())
		assert.Contains(t, spans[0].Attributes(), attribute.String("http.route", "/api/v1/projects/:project"))
		assert.Equal(t, codes.Unset, spans[0].Status().Code)
	})

	t.Run("error returned by the handler is recorded with its status code", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/broken", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusBadGateway, rec.Code)
		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Contains(t, spans[0].Attributes(), attribute.Int("http.response.status_code", http.StatusBadGateway))
		assert.Equal(t, codes.Error, spans[0].Status().Code)
	})

	// The URL path must not be used in the span name, and a 4xx response is not an error for a server span.
	t.Run("span of an unmatched route is named after the method", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{})

		req := httptest.NewRequest(http.MethodGet, "/unknown/abc123", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNotFound, rec.Code)
		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Equal(t, "GET", spans[0].Name())
		assert.Contains(t, spans[0].Attributes(), attribute.Int("http.response.status_code", http.StatusNotFound))
		assert.Equal(t, codes.Unset, spans[0].Status().Code)
	})

	// The method is sent by the client: an unknown one must not end up in the span name.
	t.Run("unknown method is replaced by HTTP in the span name", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{})

		req := httptest.NewRequest("FOO123", "/api/v1/projects/perses", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Equal(t, "HTTP /api/v1/projects/:project", spans[0].Name())
	})

	t.Run("metrics route is not traced by default", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{})

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, recorder.Ended())
	})

	t.Run("panic is recorded as an error", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/panic", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusInternalServerError, rec.Code)
		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Equal(t, "GET /api/v1/panic", spans[0].Name())
		assert.Equal(t, codes.Error, spans[0].Status().Code)
	})

	t.Run("span is a child of the trace context received with the request", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{Propagators: propagation.TraceContext{}})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/projects/perses", nil)
		req.Header.Set("traceparent", "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01")
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Equal(t, "0af7651916cd43dd8448eb211c80319c", spans[0].SpanContext().TraceID().String())
		assert.Equal(t, "b7ad6b7169203331", spans[0].Parent().SpanID().String())
	})

	t.Run("ignored routes replace the default ones", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{IgnoredRoutes: []string{"/api/v1/health"}})

		for _, path := range []string{"/api/v1/health", "/metrics"} {
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
			assert.Equal(t, http.StatusOK, rec.Code)
		}
		spans := recorder.Ended()
		require.Len(t, spans, 1)
		assert.Equal(t, "GET /metrics", spans[0].Name())
	})

	t.Run("skipped request is not traced", func(t *testing.T) {
		e, recorder := newTracedServer(t, OpenTelemetryConfig{Skipper: func(_ *echo.Context) bool { return true }})

		req := httptest.NewRequest(http.MethodGet, "/api/v1/projects/perses", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, recorder.Ended())
	})
}
