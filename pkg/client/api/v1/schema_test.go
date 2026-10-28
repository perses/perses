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

package v1

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testDashboardSchema = "#Dashboard: {\n\tkind: \"Dashboard\"\n}\n"
	testPluginsSchema   = "#Plugin_Panel_Markdown: {\n\tkind: \"Markdown\"\n}\n"
)

func newTestSchemaClient(t *testing.T) SchemaInterface {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		switch r.URL.Path {
		case "/api/v1/schemas/dashboards":
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte(testDashboardSchema))
		case "/api/v1/schemas/plugins":
			_, _ = w.Write([]byte(testPluginsSchema))
		case "/api/v1/schemas/plugins/Markdown":
			// Answer differently depending on the query parameters, so the test can verify they are sent.
			query := r.URL.Query()
			switch {
			case query.Get("version") == "0.10.0" && query.Get("registry") == "perses.dev":
				_, _ = w.Write([]byte("Markdown 0.10.0 from perses.dev"))
			case len(query) == 0:
				_, _ = w.Write([]byte("Markdown latest"))
			default:
				w.WriteHeader(http.StatusBadRequest)
			}
		case "/api/v1/schemas/plugins/Broken":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"message":"bad plugin"}`))
		default:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"message":"not found"}`))
		}
	}))
	t.Cleanup(server.Close)
	return NewWithClient(&perseshttp.RESTClient{
		BaseURL: common.MustParseURL(server.URL),
		Client:  server.Client(),
	}).Schema()
}

func TestSchema_Dashboard(t *testing.T) {
	data, err := newTestSchemaClient(t).Dashboard()
	require.NoError(t, err)
	assert.Equal(t, testDashboardSchema, string(data))
}

func TestSchema_Plugins(t *testing.T) {
	data, err := newTestSchemaClient(t).Plugins()
	require.NoError(t, err)
	assert.Equal(t, testPluginsSchema, string(data))
}

func TestSchema_Plugin(t *testing.T) {
	testSuites := []struct {
		title    string
		name     string
		query    *PluginSchemaQuery
		expected string
		err      error
	}{
		{
			title:    "without query",
			name:     "Markdown",
			expected: "Markdown latest",
		},
		{
			title:    "with version and registry",
			name:     "Markdown",
			query:    &PluginSchemaQuery{Version: "0.10.0", Registry: "perses.dev"},
			expected: "Markdown 0.10.0 from perses.dev",
		},
		{
			title: "plugin not found",
			name:  "Unknown",
			err:   perseshttp.RequestNotFoundError,
		},
		{
			title: "server error",
			name:  "Broken",
			err:   &perseshttp.RequestError{Message: "bad plugin", StatusCode: http.StatusBadRequest},
		},
	}
	client := newTestSchemaClient(t)
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			data, err := client.Plugin(test.name, test.query)
			if test.err != nil {
				assert.Equal(t, test.err, err)
				assert.Nil(t, data)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.expected, string(data))
		})
	}
}
