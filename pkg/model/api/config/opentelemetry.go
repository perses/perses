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
	"fmt"
	"time"

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

const defaultOpenTelemetryTimeout = 10 * time.Second

// OpenTelemetry contains the config to export the traces of the Perses server with the OpenTelemetry protocol (OTLP).
type OpenTelemetry struct {
	// Enable activates the export of the traces of the Perses server.
	Enable bool `json:"enable,omitempty" yaml:"enable,omitempty"`
	// Endpoint is the URL of the OTLP receiver (like an OpenTelemetry Collector).
	// With the http scheme, the connection is not encrypted.
	// With the http/protobuf protocol, the traces are sent to the path of the URL, or to /v1/traces when the URL has no path.
	Endpoint *common.URL `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	// Protocol is the transport used to send the telemetry: grpc (default) or http/protobuf.
	Protocol OTLPProtocol `json:"protocol,omitempty" yaml:"protocol,omitempty"`
	// TLSConfig to use to connect to the endpoint.
	TLSConfig *secret.PublicTLSConfig `json:"tls_config,omitempty" yaml:"tls_config,omitempty"`
	// BasicAuth credentials sent with each export request.
	BasicAuth *secret.PublicBasicAuth `json:"basic_auth,omitempty" yaml:"basic_auth,omitempty"`
	// Authorization credentials (like a bearer token) sent with each export request.
	Authorization *secret.PublicAuthorization `json:"authorization,omitempty" yaml:"authorization,omitempty"`
	// OAuth client credentials used to get the token sent with each export request.
	OAuth *secret.PublicOAuth `json:"oauth,omitempty" yaml:"oauth,omitempty"`
	// Headers sent with each export request. Their values are hidden when the configuration is returned by the API.
	Headers map[string]secret.Hidden `json:"headers,omitempty" yaml:"headers,omitempty"`
	// Compression activates the gzip compression of the export requests.
	Compression bool `json:"compression,omitempty" yaml:"compression,omitempty"`
	// Timeout is the maximum duration of an export request, retries included. Default: 10s.
	Timeout common.Duration `json:"timeout,omitempty" yaml:"timeout,omitempty"`
	// SamplingRatio is the fraction, between 0 and 1, of the traces started by Perses that are sampled.
	// A request received with a sampled trace context (W3C traceparent header) is always traced.
	// With the default value (0), Perses only records the requests that are part of a sampled trace.
	SamplingRatio float64 `json:"sampling_ratio,omitempty" yaml:"sampling_ratio,omitempty"`
}

// IsInsecure returns true when the connection to the endpoint is not encrypted (http scheme).
func (o *OpenTelemetry) IsInsecure() bool {
	return o.Endpoint != nil && o.Endpoint.URL != nil && o.Endpoint.Scheme == SchemeHTTP
}

func (o *OpenTelemetry) Verify() error {
	if !o.Enable {
		return nil
	}
	if err := o.verifyEndpoint(); err != nil {
		return err
	}
	if err := o.verifyAuthentication(); err != nil {
		return err
	}
	if o.Timeout == 0 {
		o.Timeout = common.Duration(defaultOpenTelemetryTimeout)
	}
	if o.SamplingRatio < 0 || o.SamplingRatio > 1 {
		return fmt.Errorf("opentelemetry.sampling_ratio must be between 0 and 1, got %v", o.SamplingRatio)
	}
	return nil
}

// verifyEndpoint checks the endpoint and the protocol used to reach it.
func (o *OpenTelemetry) verifyEndpoint() error {
	if o.Endpoint == nil || o.Endpoint.IsNilOrEmpty() {
		return fmt.Errorf("opentelemetry.endpoint must be set when opentelemetry is enabled")
	}
	if o.Endpoint.Scheme != SchemeHTTP && o.Endpoint.Scheme != SchemeHTTPS {
		return fmt.Errorf("opentelemetry.endpoint must be an '%s' or '%s' URL, got %q", SchemeHTTP, SchemeHTTPS, o.Endpoint.String())
	}
	if len(o.Endpoint.Host) == 0 {
		return fmt.Errorf("opentelemetry.endpoint must contain a host, got %q", o.Endpoint.String())
	}
	if o.IsInsecure() && o.TLSConfig != nil {
		return fmt.Errorf("opentelemetry.tls_config cannot be used with an http endpoint, use https instead")
	}
	return o.verifyProtocol()
}

// verifyProtocol checks the protocol used to send the telemetry, and sets the default one.
func (o *OpenTelemetry) verifyProtocol() error {
	if len(o.Protocol) == 0 {
		o.Protocol = OTLPProtocolGRPC
	}
	if o.Protocol != OTLPProtocolGRPC && o.Protocol != OTLPProtocolHTTPProtobuf {
		return fmt.Errorf("opentelemetry.protocol must be %q or %q, got %q", OTLPProtocolGRPC, OTLPProtocolHTTPProtobuf, o.Protocol)
	}
	return nil
}

// countAuthentications returns the number of authentications set.
func (o *OpenTelemetry) countAuthentications() int {
	nbAuth := 0
	for _, configured := range []bool{o.BasicAuth != nil, o.Authorization != nil, o.OAuth != nil} {
		if configured {
			nbAuth++
		}
	}
	return nbAuth
}

// verifyAuthentication checks that at most one authentication is set, that it is valid,
// and that the credentials are not sent in clear text.
func (o *OpenTelemetry) verifyAuthentication() error {
	nbAuth := o.countAuthentications()
	if nbAuth == 0 {
		return nil
	}
	if nbAuth > 1 {
		return fmt.Errorf("only one of opentelemetry.basic_auth, opentelemetry.authorization and opentelemetry.oauth can be set")
	}
	// The credentials would be sent in clear text (and the gRPC client refuses to).
	if o.IsInsecure() {
		return fmt.Errorf("an authentication cannot be used with an http opentelemetry.endpoint, use https instead")
	}
	if _, err := o.BasicAuth.Private(); err != nil {
		return fmt.Errorf("invalid opentelemetry.basic_auth: %w", err)
	}
	if _, err := o.Authorization.Private(); err != nil {
		return fmt.Errorf("invalid opentelemetry.authorization: %w", err)
	}
	if _, err := o.OAuth.Private(); err != nil {
		return fmt.Errorf("invalid opentelemetry.oauth: %w", err)
	}
	return nil
}
