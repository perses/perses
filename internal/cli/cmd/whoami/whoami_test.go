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

package whoami

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/perses/perses/internal/cli/config"
	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/pkg/client/api"
	clientConfig "github.com/perses/perses/pkg/client/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/require"
)

func TestWhoamiCMD(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/user/whoami" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		_, _ = w.Write([]byte(`{"kind":"User","metadata":{"name":"foo"},"spec":{}}`))
	}))
	t.Cleanup(server.Close)

	restClient, err := clientConfig.NewRESTClient(clientConfig.RestConfigClient{URL: common.MustParseURL(server.URL)})
	require.NoError(t, err)
	apiClient := api.NewWithClient(restClient)

	testSuite := []cmdTest.Suite{
		{
			Title:           "not connected to any API",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "no authorization",
			Args:            []string{},
			APIClient:       apiClient,
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any Perses server",
		},
		{
			Title:     "bearer token",
			Args:      []string{"--show-token"},
			APIClient: apiClient,
			Config: config.Config{RestClientConfig: clientConfig.RestConfigClient{
				Authorization: secret.NewBearerToken("foo.bar.jwt"),
			}},
			IsErrorExpected: false,
			ExpectedMessage: `Token used: foo.bar.jwt
User used: foo
`,
		},
		{
			Title:     "kubernetes login",
			Args:      []string{"--show-token"},
			APIClient: apiClient,
			Config: config.Config{RestClientConfig: clientConfig.RestConfigClient{
				K8sAuth: &clientConfig.K8sAuth{KubeconfigFile: "/home/foo/.kube/config"},
			}},
			IsErrorExpected: false,
			ExpectedMessage: `Kubeconfig file used: /home/foo/.kube/config
User used: foo
`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
