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
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestOpenTelemetry_Verify(t *testing.T) {
	enabled := OpenTelemetryTraces{Enable: true}
	testSuite := []struct {
		title      string
		otel       OpenTelemetry
		errMessage string
	}{
		{
			title: "disabled traces don't need any other setting",
			otel:  OpenTelemetry{},
		},
		{
			title: "enabled traces with an endpoint",
			otel:  OpenTelemetry{Endpoint: "otel-collector:4317", Insecure: true, Traces: enabled},
		},
		{
			title: "the traces endpoint replaces the shared one",
			otel:  OpenTelemetry{Traces: OpenTelemetryTraces{Enable: true, Endpoint: "otel-collector:4317"}},
		},
		{
			title: "enabled traces with a sampling ratio",
			otel:  OpenTelemetry{Endpoint: "otel-collector:4317", Traces: OpenTelemetryTraces{Enable: true, SamplingRatio: 0.25}},
		},
		{
			title: "http/protobuf with TLS, authorization, headers, compression and timeout",
			otel: OpenTelemetry{
				Endpoint:      "otel-collector:4318",
				Protocol:      OTLPProtocolHTTPProtobuf,
				TLSConfig:     &secret.TLSConfig{CAFile: "/etc/ssl/ca.crt"},
				Authorization: &secret.Authorization{Type: "Bearer", Credentials: "token"},
				Headers:       map[string]string{"X-Scope-OrgID": "perses"},
				Compression:   OTLPCompressionGzip,
				Timeout:       10_000_000_000,
				Traces:        enabled,
			},
		},
		{
			title:      "enabled traces require an endpoint",
			otel:       OpenTelemetry{Traces: enabled},
			errMessage: "opentelemetry.endpoint (or opentelemetry.traces.endpoint) must be set",
		},
		{
			title:      "unknown protocol is rejected",
			otel:       OpenTelemetry{Endpoint: "otel-collector:4317", Protocol: "http/json", Traces: enabled},
			errMessage: "opentelemetry.protocol must be",
		},
		{
			title:      "unknown compression is rejected",
			otel:       OpenTelemetry{Endpoint: "otel-collector:4317", Compression: "zstd", Traces: enabled},
			errMessage: "opentelemetry.compression must be",
		},
		{
			title:      "negative timeout is rejected",
			otel:       OpenTelemetry{Endpoint: "otel-collector:4317", Timeout: -1, Traces: enabled},
			errMessage: "opentelemetry.timeout must not be negative",
		},
		{
			title: "only one authentication",
			otel: OpenTelemetry{
				Endpoint:      "otel-collector:4317",
				BasicAuth:     &secret.BasicAuth{Username: "perses", Password: "secret"},
				Authorization: &secret.Authorization{Type: "Bearer", Credentials: "token"},
				Traces:        enabled,
			},
			errMessage: "only one of opentelemetry.basic_auth, opentelemetry.authorization and opentelemetry.oauth",
		},
		{
			title: "insecure and tls_config are exclusive",
			otel: OpenTelemetry{
				Endpoint: "otel-collector:4317", Insecure: true, TLSConfig: &secret.TLSConfig{CAFile: "/etc/ssl/ca.crt"}, Traces: enabled,
			},
			errMessage: "opentelemetry.insecure and opentelemetry.tls_config can't be set together",
		},
		{
			title: "no credentials over an insecure connection",
			otel: OpenTelemetry{
				Endpoint: "otel-collector:4317", Insecure: true, Authorization: &secret.Authorization{Type: "Bearer", Credentials: "token"}, Traces: enabled,
			},
			errMessage: "opentelemetry.insecure can't be set together with an authentication",
		},
		{
			title:      "sampling ratio above 1 is rejected",
			otel:       OpenTelemetry{Endpoint: "otel-collector:4317", Traces: OpenTelemetryTraces{Enable: true, SamplingRatio: 1.5}},
			errMessage: "opentelemetry.traces.sampling_ratio must be between 0 and 1",
		},
		{
			title:      "negative sampling ratio is rejected",
			otel:       OpenTelemetry{Endpoint: "otel-collector:4317", Traces: OpenTelemetryTraces{Enable: true, SamplingRatio: -0.1}},
			errMessage: "opentelemetry.traces.sampling_ratio must be between 0 and 1",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := test.otel.Verify()
			if len(test.errMessage) == 0 {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.errMessage)
			}
		})
	}
}

func TestOpenTelemetry_VerifyDefaultsToGRPC(t *testing.T) {
	otel := OpenTelemetry{Endpoint: "otel-collector:4317", Traces: OpenTelemetryTraces{Enable: true}}
	require.NoError(t, otel.Verify())
	assert.Equal(t, OTLPProtocolGRPC, otel.Protocol)
}

// The configuration is returned by the API: the credentials and the header values must not appear in it.
func TestOpenTelemetry_MarshalHidesSecrets(t *testing.T) {
	otel := OpenTelemetry{
		Endpoint:      "otel-collector:4317",
		Authorization: &secret.Authorization{Type: "Bearer", Credentials: "my-token"},
		TLSConfig:     &secret.TLSConfig{Key: "my-private-key"},
		Headers:       map[string]string{"X-Api-Key": "my-api-key"},
		Traces:        OpenTelemetryTraces{Enable: true, SamplingRatio: 0.5},
	}
	jsonData, err := json.Marshal(otel)
	require.NoError(t, err)
	yamlData, err := yaml.Marshal(otel)
	require.NoError(t, err)
	for _, data := range []string{string(jsonData), string(yamlData)} {
		assert.NotContains(t, data, "my-token")
		assert.NotContains(t, data, "my-private-key")
		assert.NotContains(t, data, "my-api-key")
		assert.Contains(t, data, "X-Api-Key")
		assert.Contains(t, data, "otel-collector:4317")
		assert.Contains(t, data, "0.5")
	}
}
