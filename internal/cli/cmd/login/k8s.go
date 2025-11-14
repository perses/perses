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
	"os/user"
	"path/filepath"

	"github.com/nexucis/lamenv"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/config"
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
	kubeconfig, err := config.InitKubeConfig(k.kubeconfigLocation)
	if err != nil {
		return nil, err
	}

	if len(k.apiClient.RESTClient().Headers) == 0 {
		k.apiClient.RESTClient().Headers = map[string]string{}
	}
	k.apiClient.RESTClient().Headers["Authorization"] = fmt.Sprintf("Bearer %s", kubeconfig.BearerToken)

	res := k.apiClient.RESTClient().Get().
		APIVersion("v1").
		Resource(fmt.Sprintf("/%s/%s", utils.PathUser, utils.PathMe)).
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
	// login information in the kubeconfig file then authenticate with it, acting as a refresh.
	return k.Login()
}

func (k *k8sLogin) SetMissingInput() error {
	return nil
}

type kubeconfigStruct struct {
	Kubeconfig string
}

// Extract the appropriate kubeconfig between a passed in value, the environment variable, and the default file location
func getKubeconfigPath(kubeconfigPath string) (string, error) {
	if kubeconfigPath != defaultKubeconfig {
		return kubeconfigPath, nil
	}

	// Load KUBECONFIG env variable if "--kubeconfig" didn't receive a location
	var kubeconfigEnv kubeconfigStruct
	err := lamenv.Unmarshal(&kubeconfigEnv, []string{})
	if err != nil {
		return "", err
	}
	if len(kubeconfigEnv.Kubeconfig) != 0 {
		return kubeconfigEnv.Kubeconfig, nil
	}

	// If KUBECONFIG isn't set, then attempt to load from the well known "~/.kube/config" location
	usr, _ := user.Current()
	dir := usr.HomeDir
	defaultFilePath := filepath.Join(dir, ".kube/config")

	return defaultFilePath, nil
}
