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

package core

import (
	"context"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/common/app"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/prometheus/common/version"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

const tracingServiceName = "perses"

// setupTracing configures the export of the traces with OTLP and adds the middleware creating a span per HTTP request.
// It does nothing when the tracing is disabled.
func setupTracing(runner *app.Runner, conf config.Tracing) error {
	if !conf.Enable {
		return nil
	}
	opts := []otlptracegrpc.Option{otlptracegrpc.WithEndpoint(conf.Endpoint)}
	if conf.Insecure {
		opts = append(opts, otlptracegrpc.WithInsecure())
	}
	// The connection is established lazily, so it doesn't block the start if the endpoint isn't reachable yet.
	exporter, err := otlptracegrpc.New(context.Background(), opts...)
	if err != nil {
		return fmt.Errorf("unable to create the OTLP trace exporter: %w", err)
	}
	// The resource attributes can be completed with the environment variables OTEL_RESOURCE_ATTRIBUTES and OTEL_SERVICE_NAME.
	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			attribute.String("service.name", tracingServiceName),
			attribute.String("service.version", version.Version),
		),
		resource.WithFromEnv(),
		resource.WithTelemetrySDK(),
	)
	if err != nil {
		return fmt.Errorf("unable to create the OpenTelemetry resource: %w", err)
	}
	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		// Follow the sampling decision of the caller, and sample a ratio of the traces started by Perses.
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(conf.SamplingRatio))),
	)
	// The runner registers the provider globally and shuts it down (flushing the remaining spans) when Perses stops.
	runner.OTeLProviderBuilder().SetProvider(provider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	runner.HTTPServerBuilder().
		Middleware(echo.WrapMiddleware(otelhttp.NewMiddleware(tracingServiceName,
			otelhttp.WithFilter(func(r *http.Request) bool {
				// The metrics are scraped very often, tracing them would only be noise.
				return r.URL.Path != "/metrics"
			}),
		))).
		Middleware(traceRoute)
	return nil
}

// traceRoute names the span of the request after the matched route (like "GET /api/v1/projects/:project/dashboards"),
// and writes the error response while the span is still open, so it records the right status code.
func traceRoute(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		span := trace.SpanFromContext(c.Request().Context())
		if route := c.Path(); len(route) > 0 {
			span.SetName(c.Request().Method + " " + route)
			span.SetAttributes(attribute.String("http.route", route))
		}
		err := next(c)
		if err != nil {
			// The error handler doesn't write the response twice, so it is fine to return the error afterward.
			c.Error(err)
		}
		return err
	}
}
