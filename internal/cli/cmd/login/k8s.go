// Copyright 2025 The Perses Authors
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

package login

import (
	"fmt"

	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"golang.org/x/oauth2"
)

type k8sLogin struct {
	apiClient          api.ClientInterface
	kubeconfigLocation string
}

func NewK8sLogin(apiClient api.ClientInterface, kubeconfigLocation string) *k8sLogin {
	return &k8sLogin{
		apiClient:          apiClient,
		kubeconfigLocation: kubeconfigLocation,
	}
}

func (k *k8sLogin) Login() (*oauth2.Token, error) {
	kubeconfig, err := secret.InitKubeConfig(k.kubeconfigLocation)
	if err != nil {
		return nil, err
	}

	if len(k.apiClient.RESTClient().Headers) == 0 {
		k.apiClient.RESTClient().Headers = map[string]string{}
	}
	k.apiClient.RESTClient().Headers["Authorization"] = fmt.Sprintf("Bearer %s", kubeconfig.BearerToken)

	res := k.apiClient.RESTClient().Get().
		APIVersion("").
		Resource(fmt.Sprintf("/%s/providers/%s/%s", utils.PathAuth, utils.AuthKindKubernetes, utils.PathWhoami)).
		Do()

	if err := res.Error(); err != nil {
		return nil, err
	}

	return &oauth2.Token{
		AccessToken: kubeconfig.BearerToken,
	}, nil
}

func (k *k8sLogin) Refresh() (*oauth2.Token, error) {
	// So long as the correct kubeconfigLocation is set, the login function will pull in the current
	// value then authenticate. Effectively acting as a refresh.
	return k.Login()
}

func (k *k8sLogin) SetMissingInput() error {
	return nil
}
