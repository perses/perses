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
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (d *discovery) services(decodedSchema []*cuetils.Node) ([]*v1.GlobalDatasource, error) {
	response, err := d.kubeClient.CoreV1().Services(d.cfg.Namespace).List(context.Background(), metav1.ListOptions{LabelSelector: buildLabelSelector(d.cfg.Labels)})
	if err != nil {
		return nil, err
	}
	var result []*v1.GlobalDatasource
	for _, item := range response.Items {
		dts, convertErr := d.serviceToGlobalDatasource(item, decodedSchema)
		if convertErr != nil {
			return nil, convertErr
		}
		result = append(result, dts)
	}
	return result, nil
}

func (d *discovery) serviceToGlobalDatasource(svc corev1.Service, decodedSchema []*cuetils.Node) (*v1.GlobalDatasource, error) {
	var port int32
	if len(svc.Spec.Ports) == 0 {
		return nil, fmt.Errorf("service %s has no ports exposed", svc.Name)
	}
	if len(svc.Spec.Ports) == 1 {
		port = svc.Spec.Ports[0].Port
	} else {
		for _, p := range svc.Spec.Ports {
			if len(d.cfg.PortName) > 0 && p.Name == d.cfg.PortName {
				port = p.Port
				break
			}
			if d.cfg.PortNumber != 0 && p.Port == d.cfg.PortNumber {
				port = p.Port
				break
			}
		}
	}
	if port == 0 {
		return nil, fmt.Errorf("service port for service %s has not been found. No service port match the name or number configured", svc.Name)
	}

	url, err := common.ParseURL(fmt.Sprintf("http://%s.%s.svc:%d", svc.Name, svc.Namespace, port))
	if err != nil {
		return nil, fmt.Errorf("")
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
			Name: svc.Name,
		},
		Spec: v1.DatasourceSpec{
			Plugin: plugin,
		},
	}, nil
}
