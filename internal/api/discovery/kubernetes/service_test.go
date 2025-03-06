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

package kubesd

import (
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
	corev1 "k8s.io/api/core/v1"
)

func TestServiceToGlobalDatasource(t *testing.T) {
	tests := []struct {
		name               string
		k8sServicePath     string
		datasourcePlugin   string
		serviceConfig      config.KubeServiceDiscovery
		expectedYAMLResult string
	}{
		{
			name:           "regular service to Prometheus Global datasource",
			k8sServicePath: filepath.Join("testdata", "service.json"),
			serviceConfig: config.KubeServiceDiscovery{
				PortName:    "http-web",
				ServiceType: string(corev1.ServiceTypeClusterIP),
			},
			datasourcePlugin: "PrometheusDatasource",
			expectedYAMLResult: `kind: GlobalDatasource
metadata:
    name: kube-monitoring.prometheus-prometheus
    createdAt: 0001-01-01T00:00:00Z
    updatedAt: 0001-01-01T00:00:00Z
    version: 0
spec:
  default: false
  plugin:
    kind: PrometheusDatasource
    spec:
      directUrl: ""
      proxy:
        kind: HTTPProxy
          spec:
          url: http://prometheus-prometheus.kube-monitoring.svc:9090
`,
		},
	}
	sch := test.UnzipAndLoadSchema().Schema()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var k8sSVC corev1.Service
			test.JSONUnmarshalFromFile(tt.k8sServicePath, &k8sSVC)
			cfg := &config.KubernetesDiscovery{
				DatasourcePluginKind: tt.datasourcePlugin,
				ServiceConfiguration: tt.serviceConfig,
			}
			k8sDiscovery := &discovery{
				schema: sch,
				cfg:    cfg,
			}
			nodes, err := k8sDiscovery.decodeSchema()
			if err != nil {
				t.Fatal(err)
			}
			svc := &serviceDiscovery{
				cfg: tt.serviceConfig,
			}
			dts, err := svc.serviceToGlobalDatasource(k8sSVC, nodes)
			if err != nil {
				t.Fatal(err)
			}
			d := test.YAMLMarshalStrict(dts)
			assert.Equal(t, tt.expectedYAMLResult, string(d))
		})
	}
}
