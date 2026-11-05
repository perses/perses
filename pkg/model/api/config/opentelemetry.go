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

package config

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
)

// OTLPProtocol is the transport used to send the telemetry with OTLP.
// The values are the ones of the OTEL_EXPORTER_OTLP_PROTOCOL environment variable.
type OTLPProtocol string

const (
	OTLPProtocolGRPC         OTLPProtocol = "grpc"
	OTLPProtocolHTTPProtobuf OTLPProtocol = "http/protobuf"
)

const (
	OTLPCompressionNone = "none"
	OTLPCompressionGzip = "gzip"
)

// OpenTelemetry contains the connection to the OTLP receiver (like an OpenTelemetry Collector),
// shared by every signal, and the configuration of each signal Perses can export.
// Only the traces are exported for now.
type OpenTelemetry struct {
	// Endpoint is the address (host:port) of the OTLP receiver.
	// With the http/protobuf protocol, the traces are sent to the path /v1/traces of this address.
	Endpoint string `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	// Protocol is the transport used to send the telemetry: grpc (default) or http/protobuf.
	Protocol OTLPProtocol `json:"protocol,omitempty" yaml:"protocol,omitempty"`
	// Insecure disables TLS when connecting to the endpoint.
	Insecure bool `json:"insecure,omitempty" yaml:"insecure,omitempty"`
	// TLSConfig to use to connect to the endpoint.
	TLSConfig *secret.PublicTLSConfig `json:"tls_config,omitempty" yaml:"tls_config,omitempty"`
	// BasicAuth credentials sent with each export request.
	BasicAuth *secret.BasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	// Authorization credentials (like a bearer token) sent with each export request.
	Authorization *secret.Authorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// OAuth client credentials used to get the token sent with each export request.
	OAuth *secret.OAuth `json:"oauth,omitempty" yaml:"oauth,omitempty"`
	// Headers sent with each export request. Their values are hidden when the configuration is returned by the API.
	Headers map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
	// Compression of the export requests: none (default) or gzip.
	Compression string `json:"compression,omitempty" yaml:"compression,omitempty"`
	// Timeout is the maximum duration of an export request, retries included.
	Timeout common.Duration `json:"timeout,omitempty" yaml:"timeout,omitempty"`
	// Traces contains the configuration of the traces of the Perses server.
	Traces OpenTelemetryTraces `json:"traces,omitzero" yaml:"traces,omitempty"`
}

type OpenTelemetryTraces struct {
	// Enable activates the export of the traces of the Perses server.
	Enable bool `json:"enable,omitempty" yaml:"enable,omitempty"`
	// Endpoint overrides the endpoint of the OTLP receiver for the traces.
	Endpoint string `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	// SamplingRatio is the fraction, between 0 and 1, of the traces started by Perses that are sampled.
	// A request received with a sampled trace context (W3C traceparent header) is always traced.
	// With the default value (0), Perses only records the requests that are part of a sampled trace.
	SamplingRatio float64 `json:"sampling_ratio,omitempty" yaml:"sampling_ratio,omitempty"`
}

// TracesEndpoint returns the endpoint the traces are sent to.
func (o *OpenTelemetry) TracesEndpoint() string {
	if len(o.Traces.Endpoint) > 0 {
		return o.Traces.Endpoint
	}
	return o.Endpoint
}

func (o *OpenTelemetry) Verify() error {
	if !o.Traces.Enable {
		return nil
	}
	if len(o.Protocol) == 0 {
		o.Protocol = OTLPProtocolGRPC
	}
	if o.Protocol != OTLPProtocolGRPC && o.Protocol != OTLPProtocolHTTPProtobuf {
		return fmt.Errorf("opentelemetry.protocol must be %q or %q, got %q", OTLPProtocolGRPC, OTLPProtocolHTTPProtobuf, o.Protocol)
	}
	if len(o.TracesEndpoint()) == 0 {
		return fmt.Errorf("opentelemetry.endpoint (or opentelemetry.traces.endpoint) must be set when the traces are enabled")
	}
	if o.Compression != "" && o.Compression != OTLPCompressionNone && o.Compression != OTLPCompressionGzip {
		return fmt.Errorf("opentelemetry.compression must be %q or %q, got %q", OTLPCompressionNone, OTLPCompressionGzip, o.Compression)
	}
	if o.Timeout < 0 {
		return fmt.Errorf("opentelemetry.timeout must not be negative")
	}
	nbAuth := 0
	for _, configured := range []bool{o.BasicAuth != nil, o.Authorization != nil, o.OAuth != nil} {
		if configured {
			nbAuth++
		}
	}
	if nbAuth > 1 {
		return fmt.Errorf("only one of opentelemetry.basic_auth, opentelemetry.authorization and opentelemetry.oauth can be set")
	}
	if o.Insecure && o.TLSConfig != nil {
		return fmt.Errorf("opentelemetry.insecure and opentelemetry.tls_config can't be set together")
	}
	// The credentials would be sent in clear text (and the gRPC client refuses to).
	if o.Insecure && nbAuth > 0 {
		return fmt.Errorf("opentelemetry.insecure can't be set together with an authentication")
	}
	if o.Traces.SamplingRatio < 0 || o.Traces.SamplingRatio > 1 {
		return fmt.Errorf("opentelemetry.traces.sampling_ratio must be between 0 and 1, got %v", o.Traces.SamplingRatio)
	}
	return nil
}

// publicOpenTelemetry is the OpenTelemetry config returned by the API: the secrets and the header values are hidden.
type publicOpenTelemetry struct {
	Endpoint      string                      `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	Protocol      OTLPProtocol                `json:"protocol,omitempty" yaml:"protocol,omitempty"`
	Insecure      bool                        `json:"insecure,omitempty" yaml:"insecure,omitempty"`
	TLSConfig     *secret.PublicTLSConfig     `json:"tls_config,omitempty" yaml:"tls_config,omitempty"`
	BasicAuth     *secret.PublicBasicAuth     `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	Authorization *secret.PublicAuthorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	OAuth         *secret.PublicOAuth         `json:"oauth,omitempty" yaml:"oauth,omitempty"`
	Headers       map[string]secret.Hidden    `json:"headers,omitempty" yaml:"headers,omitempty"`
	Compression   string                      `json:"compression,omitempty" yaml:"compression,omitempty"`
	Timeout       common.Duration             `json:"timeout,omitempty" yaml:"timeout,omitempty"`
	Traces        OpenTelemetryTraces         `json:"traces,omitzero" yaml:"traces,omitempty"`
}

func newPublicOpenTelemetry(o OpenTelemetry) publicOpenTelemetry {
	var headers map[string]secret.Hidden
	if len(o.Headers) > 0 {
		headers = make(map[string]secret.Hidden, len(o.Headers))
		for name, value := range o.Headers {
			headers[name] = secret.Hidden(value)
		}
	}
	return publicOpenTelemetry{
		Endpoint:      o.Endpoint,
		Protocol:      o.Protocol,
		Insecure:      o.Insecure,
		TLSConfig:     secret.NewPublicTLSConfig(o.TLSConfig),
		BasicAuth:     secret.NewPublicBasicAuth(o.BasicAuth),
		Authorization: secret.NewPublicAuthorization(o.Authorization),
		OAuth:         secret.NewPublicOAuth(o.OAuth),
		Headers:       headers,
		Compression:   o.Compression,
		Timeout:       o.Timeout,
		Traces:        o.Traces,
	}
}

func (o OpenTelemetry) MarshalYAML() (any, error) {
	return newPublicOpenTelemetry(o), nil
}

func (o OpenTelemetry) MarshalJSON() ([]byte, error) {
	return json.Marshal(newPublicOpenTelemetry(o))
}
