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
	"encoding/pem"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	collectortrace "go.opentelemetry.io/proto/otlp/collector/trace/v1"
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
		Endpoint:      strings.TrimPrefix(server.URL, "https://"),
		Protocol:      config.OTLPProtocolHTTPProtobuf,
		TLSConfig:     &secret.TLSConfig{CA: ca},
		Authorization: &secret.Authorization{Type: "Bearer", Credentials: "my-token"},
		Headers:       map[string]string{"X-Scope-OrgID": "perses"},
		Traces:        config.OpenTelemetryTraces{Enable: true},
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
		Protocol:  config.OTLPProtocolHTTPProtobuf,
		TLSConfig: &secret.TLSConfig{CA: ca},
		BasicAuth: &secret.BasicAuth{Username: "perses", Password: "secret"},
		Traces:    config.OpenTelemetryTraces{Enable: true, Endpoint: strings.TrimPrefix(server.URL, "https://")},
	})
	received := requests()
	require.Len(t, received, 1)
	username, password, ok := (&http.Request{Header: received[0].headers}).BasicAuth()
	assert.True(t, ok)
	assert.Equal(t, "perses", username)
	assert.Equal(t, "secret", password)
}

func TestHTTPTraceExporterRejectsUnknownCA(t *testing.T) {
	server, _, requests := newOTLPHTTPReceiver(t)
	conf := config.OpenTelemetry{
		Endpoint:  strings.TrimPrefix(server.URL, "https://"),
		Protocol:  config.OTLPProtocolHTTPProtobuf,
		TLSConfig: &secret.TLSConfig{},
		Timeout:   1_000_000_000,
		Traces:    config.OpenTelemetryTraces{Enable: true},
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
		Endpoint:      listener.Addr().String(),
		TLSConfig:     &secret.TLSConfig{CA: ca},
		Authorization: &secret.Authorization{Type: "Bearer", Credentials: "my-token"},
		Headers:       map[string]string{"X-Scope-OrgID": "perses"},
		// grpc-encoding isn't visible in the server metadata: the export succeeding shows gzip is registered and accepted.
		Compression: config.OTLPCompressionGzip,
		Traces:      config.OpenTelemetryTraces{Enable: true},
	})
	receiver.mutex.Lock()
	defer receiver.mutex.Unlock()
	require.Len(t, receiver.metadata, 1)
	assert.Equal(t, []string{"Bearer my-token"}, receiver.metadata[0].Get("authorization"))
	assert.Equal(t, []string{"perses"}, receiver.metadata[0].Get("x-scope-orgid"))
}
