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

package middleware

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type receivedRequest struct {
	called          bool
	body            string
	contentEncoding string
	contentLength   int64
}

// newForwardingServer returns an echo server using the Decompress middleware and forwarding every request to an
// upstream server (like the datasource proxy does), and a function returning the request received by the upstream.
func newForwardingServer(t *testing.T) (*echo.Echo, func() receivedRequest) {
	var received receivedRequest
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		require.NoError(t, err)
		received = receivedRequest{
			called:          true,
			body:            string(body),
			contentEncoding: r.Header.Get(echo.HeaderContentEncoding),
			contentLength:   r.ContentLength,
		}
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(upstream.Close)
	upstreamURL, err := url.Parse(upstream.URL)
	require.NoError(t, err)

	e := echo.New()
	e.Pre(Decompress())
	e.POST("/proxy", func(c *echo.Context) error {
		httputil.NewSingleHostReverseProxy(upstreamURL).ServeHTTP(c.Response(), c.Request())
		return nil
	})
	return e, func() receivedRequest { return received }
}

func gzipBody(t *testing.T, body string) []byte {
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	_, err := gz.Write([]byte(body))
	require.NoError(t, err)
	require.NoError(t, gz.Close())
	return buf.Bytes()
}

func TestDecompress(t *testing.T) {
	body := `{"query":"` + strings.Repeat("up{job=\"perses\"} ", 50) + `"}`

	t.Run("gzip body is forwarded decompressed", func(t *testing.T) {
		e, received := newForwardingServer(t)
		compressed := gzipBody(t, body)
		require.Less(t, len(compressed), len(body))

		req := httptest.NewRequest(http.MethodPost, "/proxy", bytes.NewReader(compressed))
		req.Header.Set(echo.HeaderContentEncoding, "gzip")
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, body, received().body)
		assert.Empty(t, received().contentEncoding)
	})

	t.Run("the gzip content encoding is case-insensitive", func(t *testing.T) {
		e, received := newForwardingServer(t)

		req := httptest.NewRequest(http.MethodPost, "/proxy", bytes.NewReader(gzipBody(t, body)))
		req.Header.Set(echo.HeaderContentEncoding, "GZIP")
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, body, received().body)
		assert.Empty(t, received().contentEncoding)
	})

	t.Run("empty gzip body is forwarded without content encoding", func(t *testing.T) {
		e, received := newForwardingServer(t)

		req := httptest.NewRequest(http.MethodPost, "/proxy", http.NoBody)
		req.Header.Set(echo.HeaderContentEncoding, "gzip")
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, received().body)
		assert.Empty(t, received().contentEncoding)
		assert.Equal(t, int64(0), received().contentLength)
	})

	t.Run("plain body is forwarded untouched", func(t *testing.T) {
		e, received := newForwardingServer(t)

		req := httptest.NewRequest(http.MethodPost, "/proxy", strings.NewReader(body))
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, body, received().body)
		assert.Empty(t, received().contentEncoding)
		assert.Equal(t, int64(len(body)), received().contentLength)
	})

	t.Run("other content encodings are forwarded untouched", func(t *testing.T) {
		e, received := newForwardingServer(t)

		req := httptest.NewRequest(http.MethodPost, "/proxy", strings.NewReader(body))
		req.Header.Set(echo.HeaderContentEncoding, "br")
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, body, received().body)
		assert.Equal(t, "br", received().contentEncoding)
		assert.Equal(t, int64(len(body)), received().contentLength)
	})

	for _, test := range []struct {
		name string
		body []byte
	}{
		{name: "a body that is not a gzip stream is rejected", body: []byte(body)},
		{name: "a body with a truncated gzip header is rejected", body: gzipBody(t, body)[:5]},
	} {
		t.Run(test.name, func(t *testing.T) {
			e, received := newForwardingServer(t)

			req := httptest.NewRequest(http.MethodPost, "/proxy", bytes.NewReader(test.body))
			req.Header.Set(echo.HeaderContentEncoding, "gzip")
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)

			assert.Equal(t, http.StatusBadRequest, rec.Code)
			assert.False(t, received().called)
		})
	}

	// The errors of the rest of the chain can look like the ones of an invalid gzip stream, but they don't come from
	// the gzip reader: they must not be answered with 400.
	for _, test := range []struct {
		name    string
		handler echo.HandlerFunc
	}{
		{
			name:    "an error of the next handlers is returned untouched",
			handler: func(*echo.Context) error { return io.ErrUnexpectedEOF },
		},
		{
			name:    "a panic recovered in the next handlers is answered with 500",
			handler: func(*echo.Context) error { panic(io.ErrUnexpectedEOF) },
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			e := echo.New()
			e.Pre(Decompress())
			// Like in perses/common, the panics are recovered after the pre-middlewares.
			e.Use(echoMiddleware.Recover())
			e.POST("/", test.handler)

			req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(gzipBody(t, body)))
			req.Header.Set(echo.HeaderContentEncoding, "gzip")
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)

			assert.Equal(t, http.StatusInternalServerError, rec.Code)
		})
	}
}
