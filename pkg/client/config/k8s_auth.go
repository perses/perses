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

package config

import (
	"fmt"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type K8sAuth struct {
	KubeconfigFile string `json:"kubeconfig,omitempty" yaml:"kubeconfig,omitempty"`
}

func (b *K8sAuth) GetToken() (string, error) {
	kubeconfig, err := InitKubeConfig(b.KubeconfigFile)
	if err != nil {
		return "", err
	}
	return kubeconfig.BearerToken, nil
}

// Returns initialized config, allows local usage (outside cluster) based on provided kubeconfig or in-cluster
// service account usage
func InitKubeConfig(kcLocation string) (*rest.Config, error) {
	if kcLocation != "" {
		kubeConfig, err := clientcmd.BuildConfigFromFlags("", kcLocation)
		if err != nil {
			return nil, fmt.Errorf("unable to build rest config based on provided path to kubeconfig file: %w", err)
		}
		return kubeConfig, nil
	}

	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("cannot find service account in pod to build in-cluster rest config: %w", err)
	}

	return kubeConfig, nil
}
