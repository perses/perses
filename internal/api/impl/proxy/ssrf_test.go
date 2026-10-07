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

package proxy

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/perses/perses/internal/api/impl/proxy/http"
	"github.com/perses/perses/internal/api/impl/proxy/proxytest"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewProxy_deniedDestination reproduces the reported SSRF: the unsaved proxy endpoints accept the datasource spec in
// the request body, and the saved datasources can point to any URL.
func TestNewProxy_deniedDestination(t *testing.T) {
	for _, test := range []struct {
		title string
		spec  string
	}{
		{
			title: "perses api through loopback",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://127.0.0.1:8080","secret":"my-secret"}}}}}`,
		},
		{
			title: "cloud metadata endpoint",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://169.254.169.254/latest/meta-data/","secret":"my-secret"}}}}}`,
		},
		{
			title: "non http scheme",
			spec:  `{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"file:///etc/passwd","secret":"my-secret"}}}}}`,
		},
		{
			title: "sql proxy to loopback",
			spec:  `{"plugin":{"kind":"PostgresDatasource","spec":{"proxy":{"kind":"SQLProxy","spec":{"driver":"postgres","host":"localhost:5432","database":"perses","secret":"my-secret"}}}}}`,
		},
	} {
		t.Run(test.title, func(t *testing.T) {
			var spec datasourceSpec.Spec
			require.NoError(t, json.Unmarshal([]byte(test.spec), &spec))
			retrieveSecret := func(_ string) (*v1.SecretSpec, error) {
				t.Fatal("the secret must not be loaded for a denied destination")
				return nil, nil
			}
			_, err := (&endpoint{guard: proxytest.NewDefaultGuard(t)}).newProxy("unsaved-datasource", "p1", "", spec, "/api/v1/projects", retrieveSecret)
			proxytest.RequireHTTPError(t, err, http.StatusForbidden)
		})
	}
}

func TestNewProxy_allowedDestination(t *testing.T) {
	var spec datasourceSpec.Spec
	require.NoError(t, json.Unmarshal([]byte(`{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://prometheus:9090"}}}}}`), &spec))
	pr, err := (&endpoint{guard: proxytest.NewDefaultGuard(t)}).newProxy("prometheus", "p1", "", spec, "api/v1/query", nil)
	require.NoError(t, err)
	h, ok := pr.(*httpproxy.Proxy)
	require.True(t, ok)
	assert.Equal(t, "/api/v1/query", h.Path)
}

func TestNewProxy_allowedByConfiguration(t *testing.T) {
	var spec datasourceSpec.Spec
	require.NoError(t, json.Unmarshal([]byte(`{"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":{"kind":"HTTPProxy","spec":{"url":"http://localhost:9090"}}}}}`), &spec))
	_, err := (&endpoint{guard: proxytest.NewLoopbackGuard(t)}).newProxy("prometheus", "p1", "", spec, "api/v1/query", nil)
	require.NoError(t, err)
}
