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

	"github.com/perses/perses/internal/api/discovery/cuetils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/sirupsen/logrus"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type serviceDiscovery struct {
	discoveryName string
	namespace     string
	labelSelector string
	cfg           *config.KubeServiceDiscovery
	kubeClient    *kubernetes.Clientset
}

func (d *serviceDiscovery) discover(decodedSchema []*cuetils.Node) ([]*v1.GlobalDatasource, error) {
	response, err := d.kubeClient.CoreV1().Services(d.namespace).List(context.Background(), metav1.ListOptions{LabelSelector: d.labelSelector})
	if err != nil {
		return nil, err
	}
	var result []*v1.GlobalDatasource
	for _, item := range response.Items {
		if len(d.cfg.ServiceType) != 0 && d.cfg.ServiceType != string(item.Spec.Type) {
			logrus.Tracef("service type %q doesn't match the configured service type %q", item.Spec.Type, d.cfg.ServiceType)
			continue
		}
		dts, convertErr := d.serviceToGlobalDatasource(item, decodedSchema)
		if convertErr != nil {
			return nil, convertErr
		}
		if dts != nil {
			result = append(result, dts)
		}
	}
	return result, nil
}

func (d *serviceDiscovery) serviceToGlobalDatasource(svc corev1.Service, decodedSchema []*cuetils.Node) (*v1.GlobalDatasource, error) {
	port := d.extractPort(svc)
	if port == nil {
		return nil, nil
	}

	url, err := common.ParseURL(fmt.Sprintf("http://%s.%s.svc:%d", svc.Name, svc.Namespace, port.Port))
	if err != nil {
		return nil, fmt.Errorf("unable to create the URL for the service %s: %v", svc.Name, err)
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
			Name: fmt.Sprintf("%s.%s", svc.Namespace, svc.Name),
		},
		Spec: v1.DatasourceSpec{
			Plugin: plugin,
		},
	}, nil
}

func (d *serviceDiscovery) extractPort(svc corev1.Service) *corev1.ServicePort {
	if len(d.cfg.PortName) == 0 && d.cfg.PortNumber == 0 {
		if len(svc.Spec.Ports) > 1 {
			logrus.Tracef("svc %q/%q dropped for the discovery %q because pod contains more than one container and no name has been configured to choose it", svc.Namespace, svc.Name, d.discoveryName)
			return nil
		}
		return &svc.Spec.Ports[0]
	}
	for _, p := range svc.Spec.Ports {
		if len(d.cfg.PortName) > 0 && p.Name == d.cfg.PortName {
			return &p
		}
		if d.cfg.PortNumber != 0 && p.Port == d.cfg.PortNumber {
			return &p
		}
	}
	return nil
}
