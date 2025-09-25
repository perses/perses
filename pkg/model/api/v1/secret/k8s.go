// Copyright 2023 The Perses Authors
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

package secret

import (
	"encoding/json"
	"fmt"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// The K8sAuth structs are used to save the kubeconfig file location on disk, and and have some
// utilities around loading that file or the information in it for use
type PublicK8sAuth struct {
	KubeconfigFile string `json:"kubeconfig,omitempty" yaml:"kubeconfig,omitempty"`
}

func NewPublicK8sAuth(b *K8sAuth) *PublicK8sAuth {
	if b == nil {
		return nil
	}
	return &PublicK8sAuth{
		KubeconfigFile: b.KubeconfigFile,
	}
}

type K8sAuth struct {
	KubeconfigFile string `json:"kubeconfig,omitempty" yaml:"kubeconfig,omitempty"`
}

func (b *K8sAuth) UnmarshalJSON(data []byte) error {
	var tmp K8sAuth
	type plain K8sAuth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *K8sAuth) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp K8sAuth
	type plain K8sAuth
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*b = tmp
	return nil
}

func (b *K8sAuth) GetToken() (string, error) {
	kubeconfig, err := InitKubeConfig(b.KubeconfigFile)
	if err != nil {
		return "", err
	}
	return kubeconfig.BearerToken, nil
}

func (b *K8sAuth) validate() error {
	return nil
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
