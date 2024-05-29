// Copyright 2024 The Perses Authors
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

package kubesd

import (
	"time"

	"github.com/perses/common/async"
	"github.com/perses/common/async/taskhelper"
	"github.com/perses/perses/internal/api/discovery/service"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/prometheus/common/model"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func NewDiscovery(Name string, refreshInterval model.Duration, cfg *config.KubernetesDiscovery, svc *service.ApplyService) (taskhelper.Helper, error) {
	// creates the in-cluster config
	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		panic(err.Error())
	}
	// creates the kubeClient
	kubeClient, err := kubernetes.NewForConfig(kubeConfig)
	if err != nil {
		return nil, err
	}
	sd := &discovery{
		kubeClient: kubeClient,
		svc:        svc,
		cfg:        cfg,
		name:       Name,
	}
	return taskhelper.NewTick(sd, time.Duration(refreshInterval))
}

type discovery struct {
	async.SimpleTask
	kubeClient *kubernetes.Clientset
	svc        *service.ApplyService
	cfg        *config.KubernetesDiscovery
	name       string
}
