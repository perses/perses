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
	"time"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestOpenTelemetry_Verify(t *testing.T) {
	grpcEndpoint := common.MustParseURL("https://otel-collector:4317")
	insecureEndpoint := common.MustParseURL("http://otel-collector:4317")
	testSuite := []struct {
		title      string
		otel       OpenTelemetry
		errMessage string
	}{
		{
			title: "disabled opentelemetry doesn't need any other setting",
			otel:  OpenTelemetry{},
		},
		{
			title: "enabled with an http endpoint",
			otel:  OpenTelemetry{Enable: true, Endpoint: insecureEndpoint},
		},
		{
			title: "enabled with a sampling ratio",
			otel:  OpenTelemetry{Enable: true, Endpoint: grpcEndpoint, SamplingRatio: 0.25},
		},
		{
			title: "http/protobuf with TLS, authorization, headers, compression and timeout",
			otel: OpenTelemetry{
				Enable:        true,
				Endpoint:      common.MustParseURL("https://otel-collector:4318/v1/traces"),
				Protocol:      OTLPProtocolHTTPProtobuf,
				TLSConfig:     &secret.PublicTLSConfig{CAFile: "/etc/ssl/ca.crt"},
				Authorization: &secret.PublicAuthorization{Type: "Bearer", Credentials: "token"},
				Headers:       map[string]secret.Hidden{"X-Scope-OrgID": "perses"},
				Compression:   true,
				Timeout:       common.Duration(5 * time.Second),
			},
		},
		{
			title:      "enabled requires an endpoint",
			otel:       OpenTelemetry{Enable: true},
			errMessage: "opentelemetry.endpoint must be set",
		},
		{
			title:      "the endpoint must be an http(s) URL",
			otel:       OpenTelemetry{Enable: true, Endpoint: common.MustParseURL("otel-collector:4317")},
			errMessage: "opentelemetry.endpoint must be an 'http' or 'https' URL",
		},
		{
			title:      "unknown protocol is rejected",
			otel:       OpenTelemetry{Enable: true, Endpoint: grpcEndpoint, Protocol: "http/json"},
			errMessage: "opentelemetry.protocol must be",
		},
		{
			title: "only one authentication",
			otel: OpenTelemetry{
				Enable:        true,
				Endpoint:      grpcEndpoint,
				BasicAuth:     &secret.PublicBasicAuth{Username: "perses", Password: "secret"},
				Authorization: &secret.PublicAuthorization{Type: "Bearer", Credentials: "token"},
			},
			errMessage: "only one of opentelemetry.basic_auth, opentelemetry.authorization and opentelemetry.oauth",
		},
		{
			title:      "an invalid authentication is rejected",
			otel:       OpenTelemetry{Enable: true, Endpoint: grpcEndpoint, BasicAuth: &secret.PublicBasicAuth{Username: "perses"}},
			errMessage: "invalid opentelemetry.basic_auth",
		},
		{
			title: "no tls_config with an http endpoint",
			otel: OpenTelemetry{
				Enable: true, Endpoint: insecureEndpoint, TLSConfig: &secret.PublicTLSConfig{CAFile: "/etc/ssl/ca.crt"},
			},
			errMessage: "opentelemetry.tls_config cannot be used with an http endpoint",
		},
		{
			title: "no credentials with an http endpoint",
			otel: OpenTelemetry{
				Enable: true, Endpoint: insecureEndpoint, Authorization: &secret.PublicAuthorization{Type: "Bearer", Credentials: "token"},
			},
			errMessage: "an authentication cannot be used with an http opentelemetry.endpoint",
		},
		{
			title:      "sampling ratio above 1 is rejected",
			otel:       OpenTelemetry{Enable: true, Endpoint: grpcEndpoint, SamplingRatio: 1.5},
			errMessage: "opentelemetry.sampling_ratio must be between 0 and 1",
		},
		{
			title:      "negative sampling ratio is rejected",
			otel:       OpenTelemetry{Enable: true, Endpoint: grpcEndpoint, SamplingRatio: -0.1},
			errMessage: "opentelemetry.sampling_ratio must be between 0 and 1",
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

func TestOpenTelemetry_VerifySetsDefaults(t *testing.T) {
	otel := OpenTelemetry{Enable: true, Endpoint: common.MustParseURL("https://otel-collector:4317")}
	require.NoError(t, otel.Verify())
	assert.Equal(t, OTLPProtocolGRPC, otel.Protocol)
	assert.Equal(t, common.Duration(10*time.Second), otel.Timeout)
	assert.False(t, otel.IsInsecure())
}

// The configuration is returned by the API: the credentials and the header values must not appear in it.
func TestOpenTelemetry_MarshalHidesSecrets(t *testing.T) {
	otel := OpenTelemetry{
		Enable:        true,
		Endpoint:      common.MustParseURL("https://otel-collector:4317"),
		Authorization: &secret.PublicAuthorization{Type: "Bearer", Credentials: "my-token"},
		TLSConfig:     &secret.PublicTLSConfig{Key: "my-private-key"},
		Headers:       map[string]secret.Hidden{"X-Api-Key": "my-api-key"},
		SamplingRatio: 0.5,
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

// The secrets are hidden only when the configuration is marshalled: they are read in clear from the configuration file.
func TestOpenTelemetry_UnmarshalKeepsSecrets(t *testing.T) {
	data := `
enable: true
endpoint: https://otel-collector:4317
authorization:
  type: Bearer
  credentials: my-token
headers:
  X-Api-Key: my-api-key
`
	var otel OpenTelemetry
	require.NoError(t, yaml.Unmarshal([]byte(data), &otel))
	require.NoError(t, otel.Verify())
	assert.Equal(t, secret.Hidden("my-token"), otel.Authorization.Credentials)
	assert.Equal(t, secret.Hidden("my-api-key"), otel.Headers["X-Api-Key"])
	assert.Equal(t, "otel-collector:4317", otel.Endpoint.Host)
}
