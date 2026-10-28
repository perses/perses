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

package refresh

import (
	"testing"

	"github.com/perses/perses/internal/cli/config"
	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/api/auth"
	clientConfig "github.com/perses/perses/pkg/client/config"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	"golang.org/x/oauth2"
)

type fakeAuth struct {
	auth.Interface
}

func (f fakeAuth) Refresh(_ string) (*oauth2.Token, error) {
	return &oauth2.Token{AccessToken: "new-access-token", RefreshToken: "new-refresh-token"}, nil
}

// fakeClient simulates a server that enables the Kubernetes provider next to the other ones.
// The refresh flow must be chosen from the way the user logged in, not from the server providers.
type fakeClient struct {
	api.ClientInterface
}

func (f fakeClient) Auth() auth.Interface {
	return fakeAuth{}
}

func (f fakeClient) Config() (*apiConfig.Config, error) {
	cfg := &apiConfig.Config{}
	cfg.Security.Authentication.Providers.KubernetesProvider.Enable = true
	return cfg, nil
}

func TestRefreshCMD(t *testing.T) {
	// the command writes the refreshed tokens in ./config.json
	t.Chdir(t.TempDir())
	testSuite := []cmdTest.Suite{
		{
			Title:           "args are not supported",
			Args:            []string{"foo"},
			APIClient:       fakeClient{},
			IsErrorExpected: true,
			ExpectedMessage: "no args are supported by the command 'refresh'",
		},
		{
			Title:           "no refresh token in the config",
			Args:            []string{},
			APIClient:       fakeClient{},
			IsErrorExpected: true,
			ExpectedMessage: "refresh_token doesn't exist in the config, please use the command login to get one",
		},
		{
			Title:     "kubernetes login without a kubeconfig location",
			Args:      []string{},
			APIClient: fakeClient{},
			Config: config.Config{
				RestClientConfig: clientConfig.RestConfigClient{K8sAuth: &clientConfig.K8sAuth{}},
			},
			IsErrorExpected: true,
			ExpectedMessage: "kubeconfig location has not been set, please use the command login to set it",
		},
		{
			Title:     "refresh token without a kubernetes login",
			Args:      []string{},
			APIClient: fakeClient{},
			Config: config.Config{
				RefreshToken: "refresh-token",
			},
			IsErrorExpected: false,
			ExpectedMessage: "token has been refreshed\n",
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
