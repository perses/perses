// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package core

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/common/app"
	clientConfig "github.com/perses/perses/pkg/client/config"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/prometheus/common/version"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	grpcOAuth "google.golang.org/grpc/credentials/oauth"
)

const (
	tracingServiceName = "perses"
	// tokenRequestTimeout bounds the requests to the OAuth token endpoint.
	tokenRequestTimeout = 30 * time.Second
)

// setupOpenTelemetry configures the export of the traces with OTLP and adds the middleware creating a span per HTTP request.
// It does nothing when the traces are disabled.
//
// Only the settings present in the configuration are passed to the exporter, so the standard OTEL_EXPORTER_OTLP_*
// environment variables still apply to the others.
func setupOpenTelemetry(runner *app.Runner, conf config.OpenTelemetry) error {
	if !conf.Traces.Enable {
		return nil
	}
	exporter, err := newTraceExporter(conf)
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
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(conf.Traces.SamplingRatio))),
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

// newTraceExporter creates the OTLP exporter of the traces. The connection is established lazily,
// so it doesn't block the start of Perses when the endpoint isn't reachable yet.
func newTraceExporter(conf config.OpenTelemetry) (sdktrace.SpanExporter, error) {
	tokenSource, err := newTokenSource(conf)
	if err != nil {
		return nil, err
	}
	if conf.Protocol == config.OTLPProtocolHTTPProtobuf {
		return newHTTPTraceExporter(conf, tokenSource)
	}
	return newGRPCTraceExporter(conf, tokenSource)
}

func newGRPCTraceExporter(conf config.OpenTelemetry, tokenSource oauth2.TokenSource) (sdktrace.SpanExporter, error) {
	opts := []otlptracegrpc.Option{otlptracegrpc.WithEndpoint(conf.TracesEndpoint())}
	if conf.Insecure {
		opts = append(opts, otlptracegrpc.WithInsecure())
	}
	if conf.TLSConfig != nil {
		tlsConfig, err := conf.TLSConfig.BuildTLSConfig()
		if err != nil {
			return nil, err
		}
		opts = append(opts, otlptracegrpc.WithTLSCredentials(credentials.NewTLS(tlsConfig)))
	}
	if tokenSource != nil {
		// Sent as the "authorization" metadata of each request. It requires TLS, which Verify enforces.
		opts = append(opts, otlptracegrpc.WithDialOption(grpc.WithPerRPCCredentials(grpcOAuth.TokenSource{TokenSource: tokenSource})))
	}
	if len(conf.Headers) > 0 {
		opts = append(opts, otlptracegrpc.WithHeaders(conf.Headers))
	}
	if conf.Compression == config.OTLPCompressionGzip {
		opts = append(opts, otlptracegrpc.WithCompressor(config.OTLPCompressionGzip))
	}
	if conf.Timeout > 0 {
		opts = append(opts, otlptracegrpc.WithTimeout(time.Duration(conf.Timeout)))
	}
	return otlptracegrpc.New(context.Background(), opts...)
}

func newHTTPTraceExporter(conf config.OpenTelemetry, tokenSource oauth2.TokenSource) (sdktrace.SpanExporter, error) {
	opts := []otlptracehttp.Option{otlptracehttp.WithEndpoint(conf.TracesEndpoint())}
	if conf.Insecure {
		opts = append(opts, otlptracehttp.WithInsecure())
	}
	// A client of our own only when needed: it replaces the TLS settings of the OTEL_EXPORTER_OTLP_* variables.
	if conf.TLSConfig != nil || tokenSource != nil {
		// Same transport as the other HTTP clients of Perses. The export timeout is handled by the exporter.
		var roundTripper http.RoundTripper
		roundTripper, err := clientConfig.NewRoundTripper(tokenRequestTimeout, conf.TLSConfig)
		if err != nil {
			return nil, err
		}
		if tokenSource != nil {
			roundTripper = &oauth2.Transport{Source: tokenSource, Base: roundTripper}
		}
		opts = append(opts, otlptracehttp.WithHTTPClient(&http.Client{Transport: roundTripper}))
	}
	if len(conf.Headers) > 0 {
		opts = append(opts, otlptracehttp.WithHeaders(conf.Headers))
	}
	if conf.Compression == config.OTLPCompressionGzip {
		opts = append(opts, otlptracehttp.WithCompression(otlptracehttp.GzipCompression))
	}
	if conf.Timeout > 0 {
		opts = append(opts, otlptracehttp.WithTimeout(time.Duration(conf.Timeout)))
	}
	return otlptracehttp.New(context.Background(), opts...)
}

// newTokenSource returns the credentials sent in the Authorization header of each export request,
// built the same way as for the other HTTP clients of Perses. It returns nil when no authentication is configured.
func newTokenSource(conf config.OpenTelemetry) (oauth2.TokenSource, error) {
	switch {
	case conf.BasicAuth != nil:
		password, err := conf.BasicAuth.GetPassword()
		if err != nil {
			return nil, err
		}
		return oauth2.StaticTokenSource(&oauth2.Token{
			AccessToken: base64.StdEncoding.EncodeToString(fmt.Appendf(nil, "%s:%s", conf.BasicAuth.Username, password)),
			TokenType:   "basic",
		}), nil
	case conf.Authorization != nil:
		credential, err := conf.Authorization.GetCredentials()
		if err != nil {
			return nil, err
		}
		return oauth2.StaticTokenSource(&oauth2.Token{
			AccessToken: credential,
			TokenType:   conf.Authorization.Type,
		}), nil
	case conf.OAuth != nil:
		clientSecret, err := conf.OAuth.GetClientSecret()
		if err != nil {
			return nil, err
		}
		roundTripper, err := clientConfig.NewRoundTripper(tokenRequestTimeout, conf.TLSConfig)
		if err != nil {
			return nil, err
		}
		ctx := context.WithValue(context.Background(), oauth2.HTTPClient, &http.Client{
			Transport: roundTripper,
			Timeout:   tokenRequestTimeout,
		})
		oauthConfig := &clientcredentials.Config{
			ClientID:       conf.OAuth.ClientID,
			ClientSecret:   clientSecret,
			TokenURL:       conf.OAuth.TokenURL,
			Scopes:         conf.OAuth.Scopes,
			EndpointParams: conf.OAuth.EndpointParams,
			AuthStyle:      oauth2.AuthStyle(conf.OAuth.AuthStyle),
		}
		// Caches the token and gets a new one when it expires.
		return oauthConfig.TokenSource(ctx), nil
	default:
		return nil, nil
	}
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
