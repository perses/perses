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
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	collectortrace "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	"golang.org/x/oauth2"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
)

type receivedRequest struct {
	path    string
	headers http.Header
}

// newOTLPHTTPReceiver starts a TLS server that records the export requests, and returns it with its CA in PEM.
func newOTLPHTTPReceiver(t *testing.T) (*httptest.Server, string, func() []receivedRequest) {
	var mutex sync.Mutex
	var requests []receivedRequest
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mutex.Lock()
		requests = append(requests, receivedRequest{path: r.URL.Path, headers: r.Header.Clone()})
		mutex.Unlock()
		w.Header().Set("Content-Type", "application/x-protobuf")
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(server.Close)
	ca := string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw}))
	return server, ca, func() []receivedRequest {
		mutex.Lock()
		defer mutex.Unlock()
		return append([]receivedRequest(nil), requests...)
	}
}

func exportOneSpan(t *testing.T, conf config.OpenTelemetry) {
	require.NoError(t, conf.Verify())
	exporter, err := newTraceExporter(conf)
	require.NoError(t, err)
	provider := sdktrace.NewTracerProvider(sdktrace.WithSyncer(exporter), sdktrace.WithSampler(sdktrace.AlwaysSample()))
	_, span := provider.Tracer("test").Start(context.Background(), "test")
	span.End()
	require.NoError(t, provider.Shutdown(context.Background()))
}

func TestHTTPTraceExporterUsesTLSConfigAndAuthorization(t *testing.T) {
	server, ca, requests := newOTLPHTTPReceiver(t)
	exportOneSpan(t, config.OpenTelemetry{
		Enable:        true,
		Endpoint:      common.MustParseURL(server.URL),
		Protocol:      config.OTLPProtocolHTTPProtobuf,
		TLSConfig:     &secret.PublicTLSConfig{CA: secret.Hidden(ca)},
		Authorization: &secret.PublicAuthorization{Type: "Bearer", Credentials: "my-token"},
		Headers:       map[string]secret.Hidden{"X-Scope-OrgID": "perses"},
	})
	received := requests()
	require.Len(t, received, 1)
	assert.Equal(t, "/v1/traces", received[0].path)
	assert.Equal(t, "Bearer my-token", received[0].headers.Get("Authorization"))
	assert.Equal(t, "perses", received[0].headers.Get("X-Scope-OrgID"))
}

func TestHTTPTraceExporterUsesBasicAuth(t *testing.T) {
	server, ca, requests := newOTLPHTTPReceiver(t)
	exportOneSpan(t, config.OpenTelemetry{
		Enable:    true,
		Endpoint:  common.MustParseURL(server.URL + "/custom/traces"),
		Protocol:  config.OTLPProtocolHTTPProtobuf,
		TLSConfig: &secret.PublicTLSConfig{CA: secret.Hidden(ca)},
		BasicAuth: &secret.PublicBasicAuth{Username: "perses", Password: "secret"},
	})
	received := requests()
	require.Len(t, received, 1)
	// The path of the endpoint is kept when it is set.
	assert.Equal(t, "/custom/traces", received[0].path)
	username, password, ok := (&http.Request{Header: received[0].headers}).BasicAuth()
	assert.True(t, ok)
	assert.Equal(t, "perses", username)
	assert.Equal(t, "secret", password)
}

func TestHTTPTraceExporterRejectsUnknownCA(t *testing.T) {
	server, _, requests := newOTLPHTTPReceiver(t)
	conf := config.OpenTelemetry{
		Enable:    true,
		Endpoint:  common.MustParseURL(server.URL),
		Protocol:  config.OTLPProtocolHTTPProtobuf,
		TLSConfig: &secret.PublicTLSConfig{},
		Timeout:   1_000_000_000,
	}
	require.NoError(t, conf.Verify())
	exporter, err := newTraceExporter(conf)
	require.NoError(t, err)
	provider := sdktrace.NewTracerProvider(sdktrace.WithSyncer(exporter), sdktrace.WithSampler(sdktrace.AlwaysSample()))
	_, span := provider.Tracer("test").Start(context.Background(), "test")
	span.End()
	_ = provider.Shutdown(context.Background())
	// The server certificate isn't signed by a trusted CA: the handshake fails before any request is handled.
	assert.Empty(t, requests())
}

type otlpGRPCReceiver struct {
	collectortrace.UnimplementedTraceServiceServer
	mutex    sync.Mutex
	metadata []metadata.MD
}

func (r *otlpGRPCReceiver) Export(ctx context.Context, _ *collectortrace.ExportTraceServiceRequest) (*collectortrace.ExportTraceServiceResponse, error) {
	md, _ := metadata.FromIncomingContext(ctx)
	r.mutex.Lock()
	r.metadata = append(r.metadata, md)
	r.mutex.Unlock()
	return &collectortrace.ExportTraceServiceResponse{}, nil
}

func TestGRPCTraceExporterUsesTLSConfigAndAuthorization(t *testing.T) {
	// Borrow the certificate (valid for 127.0.0.1) of a TLS test server.
	certServer, ca, _ := newOTLPHTTPReceiver(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	receiver := &otlpGRPCReceiver{}
	server := grpc.NewServer(grpc.Creds(credentials.NewTLS(&tls.Config{Certificates: certServer.TLS.Certificates, MinVersion: tls.VersionTLS12})))
	collectortrace.RegisterTraceServiceServer(server, receiver)
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(server.Stop)

	exportOneSpan(t, config.OpenTelemetry{
		Enable:        true,
		Endpoint:      common.MustParseURL("https://" + listener.Addr().String()),
		TLSConfig:     &secret.PublicTLSConfig{CA: secret.Hidden(ca)},
		Authorization: &secret.PublicAuthorization{Type: "Bearer", Credentials: "my-token"},
		Headers:       map[string]secret.Hidden{"X-Scope-OrgID": "perses"},
		// grpc-encoding isn't visible in the server metadata: the export succeeding shows gzip is registered and accepted.
		Compression: true,
	})
	receiver.mutex.Lock()
	defer receiver.mutex.Unlock()
	require.Len(t, receiver.metadata, 1)
	assert.Equal(t, []string{"Bearer my-token"}, receiver.metadata[0].Get("authorization"))
	assert.Equal(t, []string{"perses"}, receiver.metadata[0].Get("x-scope-orgid"))
}

// With an http endpoint, the export is sent in clear text, to /v1/traces when the endpoint has no path.
func TestHTTPTraceExporterWithHTTPEndpoint(t *testing.T) {
	var mutex sync.Mutex
	var paths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mutex.Lock()
		paths = append(paths, r.URL.Path)
		mutex.Unlock()
		w.Header().Set("Content-Type", "application/x-protobuf")
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(server.Close)
	exportOneSpan(t, config.OpenTelemetry{
		Enable:   true,
		Endpoint: common.MustParseURL(server.URL),
		Protocol: config.OTLPProtocolHTTPProtobuf,
	})
	mutex.Lock()
	defer mutex.Unlock()
	assert.Equal(t, []string{"/v1/traces"}, paths)
}

// newOAuthTokenServer starts a TLS token endpoint (with the same certificate as newOTLPHTTPReceiver) returning,
// for the client credentials it receives, the token "token-of-<client secret>" that expires immediately.
func newOAuthTokenServer(t *testing.T) *httptest.Server {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientID, clientSecret, ok := r.BasicAuth()
		if !ok || clientID != "perses" || r.FormValue("grant_type") != "client_credentials" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "token-of-" + clientSecret, "token_type": "Bearer", "expires_in": 1})
	}))
	t.Cleanup(server.Close)
	return server
}

func TestHTTPTraceExporterUsesOAuth(t *testing.T) {
	server, ca, requests := newOTLPHTTPReceiver(t)
	tokenServer := newOAuthTokenServer(t)
	exportOneSpan(t, config.OpenTelemetry{
		Enable:    true,
		Endpoint:  common.MustParseURL(server.URL),
		Protocol:  config.OTLPProtocolHTTPProtobuf,
		TLSConfig: &secret.PublicTLSConfig{CA: secret.Hidden(ca)},
		OAuth: &secret.PublicOAuth{
			ClientID:     "perses",
			ClientSecret: "secret", //nolint:gosec // G101: test value, not a real credential
			TokenURL:     tokenServer.URL,
			AuthStyle:    int(oauth2.AuthStyleInHeader),
		},
	})
	received := requests()
	require.Len(t, received, 1)
	assert.Equal(t, "Bearer token-of-secret", received[0].headers.Get("Authorization"))
}

// The credentials files can be rotated (like a Kubernetes projected service account token):
// they are read each time a token is requested, and once when the token source is created.
func TestTokenSourceReadsRotatedFiles(t *testing.T) {
	_, ca, _ := newOTLPHTTPReceiver(t)
	tokenServer := newOAuthTokenServer(t)
	testSuite := []struct {
		title     string
		conf      func(file string) config.OpenTelemetry
		tokenOfV1 string
		tokenOfV2 string
	}{
		{
			title: "authorization credentialsFile",
			conf: func(file string) config.OpenTelemetry {
				return config.OpenTelemetry{Authorization: &secret.PublicAuthorization{Type: "Bearer", CredentialsFile: file}}
			},
			tokenOfV1: "Bearer v1",
			tokenOfV2: "Bearer v2",
		},
		{
			title: "basic_auth passwordFile",
			conf: func(file string) config.OpenTelemetry {
				return config.OpenTelemetry{BasicAuth: &secret.PublicBasicAuth{Username: "perses", PasswordFile: file}}
			},
			tokenOfV1: "Basic " + base64.StdEncoding.EncodeToString([]byte("perses:v1")),
			tokenOfV2: "Basic " + base64.StdEncoding.EncodeToString([]byte("perses:v2")),
		},
		{
			title: "oauth clientSecretFile",
			conf: func(file string) config.OpenTelemetry {
				return config.OpenTelemetry{
					TLSConfig: &secret.PublicTLSConfig{CA: secret.Hidden(ca)},
					OAuth: &secret.PublicOAuth{
						ClientID:         "perses",
						ClientSecretFile: file,
						TokenURL:         tokenServer.URL,
						AuthStyle:        int(oauth2.AuthStyleInHeader),
					},
				}
			},
			tokenOfV1: "Bearer token-of-v1",
			tokenOfV2: "Bearer token-of-v2",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			file := filepath.Join(t.TempDir(), "credentials")
			require.NoError(t, os.WriteFile(file, []byte("v1"), 0o600))
			tokenSource, err := newTokenSource(test.conf(file))
			require.NoError(t, err)
			assertToken(t, tokenSource, test.tokenOfV1)

			require.NoError(t, os.WriteFile(file, []byte("v2"), 0o600))
			assertToken(t, tokenSource, test.tokenOfV2)

			// A file that can't be read fails at startup.
			_, err = newTokenSource(test.conf(filepath.Join(t.TempDir(), "missing")))
			assert.ErrorIs(t, err, os.ErrNotExist)
		})
	}
}

func assertToken(t *testing.T, tokenSource oauth2.TokenSource, expected string) {
	t.Helper()
	token, err := tokenSource.Token()
	require.NoError(t, err)
	assert.Equal(t, expected, token.Type()+" "+token.AccessToken)
}
