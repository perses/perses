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

package httpproxy

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type receivedRequest struct {
	Header http.Header `json:"header"`
	Body   string      `json:"body"`
}

func newSigV4Server(t *testing.T) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		require.NoError(t, err)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(receivedRequest{Header: r.Header, Body: string(body)})
	}))
	t.Cleanup(server.Close)
	return server
}

func newSigV4Proxy(t *testing.T, serverURL string, sigv4 *secretModel.SigV4, proxyConfig config.HTTPProxyConfig) *Proxy {
	t.Helper()
	return &Proxy{
		Config:      &datasourceHTTP.Config{URL: common.MustParseURL(serverURL)},
		Secret:      &v1.SecretSpec{SigV4: sigv4},
		Path:        "/",
		Guard:       proxytest.NewLoopbackGuard(t),
		ProxyConfig: proxyConfig,
	}
}

func serveCloudWatchRequest(t *testing.T, h *Proxy) (*httptest.ResponseRecorder, error) {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "http://perses.example.com/proxy/datasources/cloudwatch", strings.NewReader(`{"Namespace":"AWS/EC2"}`))
	req.Header.Set("Content-Type", "application/x-amz-json-1.1")
	req.Header.Set("X-Amz-Target", "GraniteServiceVersion20100801.ListMetrics")
	rec := httptest.NewRecorder()
	return rec, h.Serve(echo.New().NewContext(req, rec))
}

func TestHTTPProxy_serve_sigV4StaticCredentials(t *testing.T) {
	server := newSigV4Server(t)
	h := newSigV4Proxy(t, server.URL, &secretModel.SigV4{ //nolint:gosec // test credentials
		Region:      "eu-west-3",
		AccessKey:   "AKIDEXAMPLE",
		SecretKey:   "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
		ServiceName: "monitoring",
	}, config.HTTPProxyConfig{})

	rec, err := serveCloudWatchRequest(t, h)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, rec.Code)

	var received receivedRequest
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &received))
	authorization := received.Header.Get("Authorization")
	assert.True(t, strings.HasPrefix(authorization, "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/"), authorization)
	assert.Contains(t, authorization, "/eu-west-3/monitoring/aws4_request")
	assert.Contains(t, authorization, "x-amz-target")
	assert.NotEmpty(t, received.Header.Get("X-Amz-Date"))
	// The body is still forwarded once signed.
	assert.Equal(t, `{"Namespace":"AWS/EC2"}`, received.Body)
}

func TestHTTPProxy_serve_sigV4DefaultCredentials(t *testing.T) {
	server := newSigV4Server(t)
	// The default credential chain of the test process must not be used.
	t.Setenv("AWS_ACCESS_KEY_ID", "AKIDSERVER")
	t.Setenv("AWS_SECRET_ACCESS_KEY", "server-secret")
	t.Setenv("AWS_EC2_METADATA_DISABLED", "true")
	t.Setenv("AWS_CONFIG_FILE", "/dev/null")
	t.Setenv("AWS_SHARED_CREDENTIALS_FILE", "/dev/null")

	for _, sigv4 := range []*secretModel.SigV4{
		{Region: "us-east-1", ServiceName: "monitoring"},
		// Assuming a role without an access key also relies on the identity of the server.
		{Region: "us-east-1", ServiceName: "monitoring", RoleARN: "arn:aws:iam::123456789012:role/perses"},
	} {
		t.Run("denied by default", func(t *testing.T) {
			_, err := serveCloudWatchRequest(t, newSigV4Proxy(t, server.URL, sigv4, config.HTTPProxyConfig{}))
			proxytest.RequireHTTPError(t, err, http.StatusForbidden)
			assert.Contains(t, err.Error(), "allow_default_credentials")
		})
	}

	t.Run("allowed by the configuration", func(t *testing.T) {
		h := newSigV4Proxy(t, server.URL, &secretModel.SigV4{Region: "us-east-1", ServiceName: "monitoring"},
			config.HTTPProxyConfig{SigV4: config.SigV4ProxyConfig{AllowDefaultCredentials: true}})
		rec, err := serveCloudWatchRequest(t, h)
		require.NoError(t, err)
		var received receivedRequest
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &received))
		assert.Contains(t, received.Header.Get("Authorization"), "Credential=AKIDSERVER/")
	})
}

func TestTransportCache_getSigner(t *testing.T) {
	cache := NewTransportCache()
	build := func() (*http.Transport, error) { return &http.Transport{}, nil }
	transport, err := cache.get("datasource", transportSettings{}, build)
	require.NoError(t, err)

	cfg := &secretModel.SigV4{Region: "us-east-1", AccessKey: "AKIDEXAMPLE", SecretKey: "secret", ServiceName: "monitoring"}
	builds := 0
	buildSigner := func() (http.RoundTripper, error) {
		builds++
		return newSigV4RoundTripper(context.Background(), cfg, "secret", transport)
	}
	hash, err := hashSigV4(cfg, "secret")
	require.NoError(t, err)

	first, err := cache.getSigner("datasource", hash, transport, buildSigner)
	require.NoError(t, err)
	second, err := cache.getSigner("datasource", hash, transport, buildSigner)
	require.NoError(t, err)
	assert.Same(t, first, second)
	assert.Equal(t, 1, builds)

	// A new secret key rebuilds the signer.
	newHash, err := hashSigV4(cfg, "rotated")
	require.NoError(t, err)
	assert.NotEqual(t, hash, newHash)
	_, err = cache.getSigner("datasource", newHash, transport, buildSigner)
	require.NoError(t, err)
	assert.Equal(t, 2, builds)

	// A signer wrapping another transport than the cached one is not cached.
	_, err = cache.getSigner("datasource", newHash, &http.Transport{}, buildSigner)
	require.NoError(t, err)
	_, err = cache.getSigner("datasource", newHash, transport, buildSigner)
	require.NoError(t, err)
	assert.Equal(t, 3, builds)
}
