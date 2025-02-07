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
	"context"
	"fmt"

	"github.com/perses/perses/api/discovery/cuetils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/sirupsen/logrus"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type podDiscovery struct {
	discoveryName string
	namespace     string
	labelSelector string
	cfg           config.KubePodDiscovery
	kubeClient    *kubernetes.Clientset
}

func (d *podDiscovery) discover(decodedSchema []*cuetils.Node) ([]*v1.GlobalDatasource, error) {
	response, err := d.kubeClient.CoreV1().Pods(d.namespace).List(context.Background(), metav1.ListOptions{LabelSelector: d.labelSelector})
	if err != nil {
		return nil, err
	}
	var result []*v1.GlobalDatasource
	for _, item := range response.Items {
		dts, convertErr := d.podToGlobalDatasource(item, decodedSchema)
		if convertErr != nil {
			return nil, convertErr
		}
		if dts != nil {
			result = append(result, dts)
		}
	}
	return result, nil
}

func (d *podDiscovery) podToGlobalDatasource(pod corev1.Pod, decodedSchema []*cuetils.Node) (*v1.GlobalDatasource, error) {
	container := d.extractContainer(pod)
	if container == nil {
		return nil, nil
	}
	port := d.extractPort(pod, container)
	if port == nil {
		return nil, nil
	}
	url, err := common.ParseURL(fmt.Sprintf("http://%s:%d", pod.Status.PodIP, port.ContainerPort))
	if err != nil {
		return nil, fmt.Errorf("unable to create the URL for the pod %s: %v", pod.Name, err)
	}

	proxy := http.Config{
		URL: url,
	}
	plugin, err := cuetils.BuildPluginAndInjectProxy(decodedSchema, proxy)
	if err != nil {
		return nil, err
	}

	return &v1.GlobalDatasource{
		Kind: v1.KindGlobalDatasource,
		Metadata: v1.Metadata{
			Name: fmt.Sprintf("%s.%s", pod.Namespace, pod.Name),
		},
		Spec: v1.DatasourceSpec{
			Plugin: plugin,
		},
	}, nil
}

func (d *podDiscovery) extractContainer(pod corev1.Pod) *corev1.Container {
	if len(d.cfg.ContainerName) == 0 {
		if len(pod.Spec.Containers) > 1 {
			logrus.Tracef("pod %q/%q dropped for the discovery %q because pod contains more than one container and no name has been configured to choose it", pod.Namespace, pod.Name, d.discoveryName)
			return nil
		}
		return &pod.Spec.Containers[0]
	}
	for _, c := range pod.Spec.Containers {
		if c.Name == d.cfg.ContainerName {
			return &c
		}
	}
	return nil
}

func (d *podDiscovery) extractPort(pod corev1.Pod, container *corev1.Container) *corev1.ContainerPort {
	if len(d.cfg.ContainerPortName) == 0 && d.cfg.ContainerPortNumber == 0 {
		if len(container.Ports) > 1 {
			logrus.Tracef("pod %q/%q dropped for the discovery %q because container %q contains more than one port and no name has been configured to choose it", pod.Namespace, pod.Name, container.Name, d.discoveryName)
			return nil
		}
		return &container.Ports[0]
	}
	for _, p := range container.Ports {
		if len(d.cfg.ContainerPortName) > 0 && p.Name == d.cfg.ContainerPortName {
			return &p
		}
		if d.cfg.ContainerPortNumber != 0 && p.HostPort == d.cfg.ContainerPortNumber {
			return &p
		}
	}
	return nil
}
