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

	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/common/version"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

const (
	tracingServiceName = "perses"
	// tracesURLPath is the default path of the traces for the http/protobuf protocol.
	tracesURLPath = "/v1/traces"
	// tokenRequestTimeout bounds the requests to the OAuth token endpoint.
	tokenRequestTimeout = 30 * time.Second
)

// newTracerProvider creates the provider exporting the traces with OTLP, as described by the configuration.
//
// Only the settings present in the configuration are passed to the exporter, so the standard OTEL_EXPORTER_OTLP_*
// environment variables still apply to the others.
func newTracerProvider(conf config.OpenTelemetry) (*sdktrace.TracerProvider, error) {
	exporter, err := newTraceExporter(conf)
	if err != nil {
		return nil, fmt.Errorf("unable to create the OTLP trace exporter: %w", err)
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
		return nil, fmt.Errorf("unable to create the OpenTelemetry resource: %w", err)
	}
	return sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		// Follow the sampling decision of the caller, and sample a ratio of the traces started by Perses.
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(conf.SamplingRatio))),
	), nil
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
	// The scheme of the URL defines whether the connection is encrypted. Its path is not used with gRPC.
	opts := []otlptracegrpc.Option{
		otlptracegrpc.WithEndpointURL(conf.Endpoint.String()),
		otlptracegrpc.WithTimeout(time.Duration(conf.Timeout)),
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
		opts = append(opts, otlptracegrpc.WithDialOption(grpc.WithPerRPCCredentials(tokenCredentials{source: tokenSource})))
	}
	if headers := plainHeaders(conf); len(headers) > 0 {
		opts = append(opts, otlptracegrpc.WithHeaders(headers))
	}
	if conf.Compression {
		opts = append(opts, otlptracegrpc.WithCompressor("gzip"))
	}
	return otlptracegrpc.New(context.Background(), opts...)
}

// tokenCredentials sends the token of the source in the "authorization" metadata of each gRPC request.
type tokenCredentials struct {
	source oauth2.TokenSource
}

func (c tokenCredentials) GetRequestMetadata(ctx context.Context, _ ...string) (map[string]string, error) {
	token, err := c.source.Token()
	if err != nil {
		return nil, err
	}
	requestInfo, _ := credentials.RequestInfoFromContext(ctx)
	if err := credentials.CheckSecurityLevel(requestInfo.AuthInfo, credentials.PrivacyAndIntegrity); err != nil {
		return nil, fmt.Errorf("unable to send the credentials: %w", err)
	}
	return map[string]string{"authorization": token.Type() + " " + token.AccessToken}, nil
}

// RequireTransportSecurity makes gRPC refuse to send the credentials over a connection without TLS.
func (tokenCredentials) RequireTransportSecurity() bool {
	return true
}

func newHTTPTraceExporter(conf config.OpenTelemetry, tokenSource oauth2.TokenSource) (sdktrace.SpanExporter, error) {
	endpoint := *conf.Endpoint.URL
	if endpoint.Path == "" || endpoint.Path == "/" {
		endpoint.Path = tracesURLPath
	}
	// The scheme of the URL defines whether the connection is encrypted.
	opts := []otlptracehttp.Option{
		otlptracehttp.WithEndpointURL(endpoint.String()),
		otlptracehttp.WithTimeout(time.Duration(conf.Timeout)),
	}
	// A client of our own only when needed: it replaces the TLS settings of the OTEL_EXPORTER_OTLP_* variables.
	if conf.TLSConfig != nil || tokenSource != nil {
		transport, err := newTransport(conf)
		if err != nil {
			return nil, err
		}
		var roundTripper http.RoundTripper = transport
		if tokenSource != nil {
			roundTripper = &oauth2.Transport{Source: tokenSource, Base: roundTripper}
		}
		// The export timeout is handled by the exporter.
		opts = append(opts, otlptracehttp.WithHTTPClient(&http.Client{Transport: roundTripper}))
	}
	if headers := plainHeaders(conf); len(headers) > 0 {
		opts = append(opts, otlptracehttp.WithHeaders(headers))
	}
	if conf.Compression {
		opts = append(opts, otlptracehttp.WithCompression(otlptracehttp.GzipCompression))
	}
	return otlptracehttp.New(context.Background(), opts...)
}

// newTransport returns the HTTP transport used to reach the endpoint (and the OAuth token URL), with the TLS config.
func newTransport(conf config.OpenTelemetry) (*http.Transport, error) {
	tlsConfig, err := conf.TLSConfig.BuildTLSConfig()
	if err != nil {
		return nil, err
	}
	defaultTransport, ok := http.DefaultTransport.(*http.Transport)
	if !ok {
		return nil, fmt.Errorf("http.DefaultTransport is not an *http.Transport")
	}
	transport := defaultTransport.Clone()
	transport.TLSClientConfig = tlsConfig
	return transport, nil
}

func plainHeaders(conf config.OpenTelemetry) map[string]string {
	if len(conf.Headers) == 0 {
		return nil
	}
	headers := make(map[string]string, len(conf.Headers))
	for name, value := range conf.Headers {
		headers[name] = string(value)
	}
	return headers
}

// newTokenSource returns the credentials sent in the Authorization header of each export request,
// built the same way as for the other HTTP clients of Perses. It returns nil when no authentication is configured.
func newTokenSource(conf config.OpenTelemetry) (oauth2.TokenSource, error) {
	switch {
	case conf.BasicAuth != nil:
		return newBasicAuthTokenSource(conf.BasicAuth)
	case conf.Authorization != nil:
		return newAuthorizationTokenSource(conf.Authorization)
	case conf.OAuth != nil:
		return newOAuthTokenSource(conf)
	default:
		return nil, nil
	}
}

// newBasicAuthTokenSource returns a token source reading the password each time a token is requested,
// so a rotated passwordFile is taken into account. The password is read once here, to fail at startup when it can't be.
func newBasicAuthTokenSource(publicBasicAuth *secret.PublicBasicAuth) (oauth2.TokenSource, error) {
	basicAuth, err := publicBasicAuth.Private()
	if err != nil {
		return nil, err
	}
	source := &basicAuthTokenSource{basicAuth: basicAuth}
	if _, err := source.Token(); err != nil {
		return nil, err
	}
	return source, nil
}

type basicAuthTokenSource struct {
	basicAuth *secret.BasicAuth
}

func (s *basicAuthTokenSource) Token() (*oauth2.Token, error) {
	password, err := s.basicAuth.GetPassword()
	if err != nil {
		return nil, err
	}
	return &oauth2.Token{
		AccessToken: base64.StdEncoding.EncodeToString(fmt.Appendf(nil, "%s:%s", s.basicAuth.Username, password)),
		TokenType:   "basic",
	}, nil
}

// newAuthorizationTokenSource returns a token source reading the credentials each time a token is requested,
// so a rotated credentialsFile is taken into account. The credentials are read once here, to fail at startup when they can't be.
func newAuthorizationTokenSource(publicAuthorization *secret.PublicAuthorization) (oauth2.TokenSource, error) {
	authorization, err := publicAuthorization.Private()
	if err != nil {
		return nil, err
	}
	source := &authorizationTokenSource{authorization: authorization}
	if _, err := source.Token(); err != nil {
		return nil, err
	}
	return source, nil
}

type authorizationTokenSource struct {
	authorization *secret.Authorization
}

func (s *authorizationTokenSource) Token() (*oauth2.Token, error) {
	credential, err := s.authorization.GetCredentials()
	if err != nil {
		return nil, err
	}
	return &oauth2.Token{AccessToken: credential, TokenType: s.authorization.Type}, nil
}

// newOAuthTokenSource returns the token source of the OAuth client credentials. It caches the token and gets a new one when it expires.
// The client secret is read each time a new token is requested, so a rotated clientSecretFile is taken into account.
// The token endpoint is reached with the TLS config of the OTLP receiver.
func newOAuthTokenSource(conf config.OpenTelemetry) (oauth2.TokenSource, error) {
	oauth, err := conf.OAuth.Private()
	if err != nil {
		return nil, err
	}
	// Read once here, to fail at startup when it can't be.
	if _, err := oauth.GetClientSecret(); err != nil {
		return nil, err
	}
	transport, err := newTransport(conf)
	if err != nil {
		return nil, err
	}
	ctx := context.WithValue(context.Background(), oauth2.HTTPClient, &http.Client{
		Transport: transport,
		Timeout:   tokenRequestTimeout,
	})
	return oauth2.ReuseTokenSource(nil, &oauthTokenSource{
		ctx:   ctx,
		oauth: oauth,
		config: &clientcredentials.Config{
			ClientID:       oauth.ClientID,
			TokenURL:       oauth.TokenURL,
			Scopes:         oauth.Scopes,
			EndpointParams: oauth.EndpointParams,
			AuthStyle:      oauth2.AuthStyle(oauth.AuthStyle),
		},
	}), nil
}

// oauthTokenSource gets a new token from the token endpoint, with the client secret read when it is called.
// It must be wrapped by oauth2.ReuseTokenSource, which caches the token and serializes the calls to Token.
type oauthTokenSource struct {
	ctx   context.Context
	oauth *secret.OAuth
	// config is kept across the calls, as it caches the auth style detected when the AuthStyle is not set.
	config *clientcredentials.Config
}

func (s *oauthTokenSource) Token() (*oauth2.Token, error) {
	clientSecret, err := s.oauth.GetClientSecret()
	if err != nil {
		return nil, err
	}
	s.config.ClientSecret = clientSecret
	return s.config.Token(s.ctx)
}
