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
	"slices"

	echootel "github.com/labstack/echo-otel/v5"
	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"go.opentelemetry.io/otel/metric/noop"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

type OpenTelemetryConfig struct {
	Skipper echoMiddleware.Skipper
	// IgnoredRoutes is the list of routes (as registered in echo, like /metrics or /api/v1/projects/:project) that are not traced.
	// The route is used instead of the URL, as the URL is controlled by the client.
	IgnoredRoutes []string
	// TracerProvider creates the spans. The global provider is used when it is nil.
	TracerProvider trace.TracerProvider
	// Propagators extract the trace context received with the request. The global propagators are used when it is nil.
	Propagators propagation.TextMapPropagator
}

var defaultOpenTelemetryConfig = OpenTelemetryConfig{
	Skipper: echoMiddleware.DefaultSkipper,
	// The metrics are scraped very often, tracing them would only be noise.
	IgnoredRoutes: []string{"/metrics"},
}

// OpenTelemetry returns a middleware that creates a server span for each request, following the HTTP semantic conventions:
// it is named after the matched route (like "GET /api/v1/projects/:project"), and records the status code resolved
// from the error returned by the next handlers, as well as the panics.
// The trace context received with the request is used as the parent.
func OpenTelemetry() echo.MiddlewareFunc {
	return OpenTelemetryWithConfig(defaultOpenTelemetryConfig)
}

// OpenTelemetryWithConfig returns an OpenTelemetry middleware (see OpenTelemetry) with the given configuration.
func OpenTelemetryWithConfig(config OpenTelemetryConfig) echo.MiddlewareFunc {
	if config.Skipper == nil {
		config.Skipper = defaultOpenTelemetryConfig.Skipper
	}
	if config.IgnoredRoutes == nil {
		config.IgnoredRoutes = defaultOpenTelemetryConfig.IgnoredRoutes
	}
	return echootel.NewMiddlewareWithConfig(echootel.Config{
		Skipper: func(c *echo.Context) bool {
			return config.Skipper(c) || slices.Contains(config.IgnoredRoutes, c.Path())
		},
		TracerProvider: config.TracerProvider,
		Propagators:    config.Propagators,
		// The metrics of the HTTP requests are already exposed with Prometheus.
		MeterProvider: noop.NewMeterProvider(),
	})
}
