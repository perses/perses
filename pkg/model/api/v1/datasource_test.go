// Copyright 2021 The Perses Authors
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

package v1

import (
	"encoding/json"
	"net/url"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONDatasource(t *testing.T) {
	u, _ := url.Parse("https://prometheus.demo.do.prometheus.io")
	pluginSpec := &datasource.Prometheus{
		Proxy: datasourceHTTP.Proxy{
			Kind: "HTTPProxy",
			Spec: datasourceHTTP.Config{
				URL: u,
			},
		},
	}
	data, err := json.Marshal(pluginSpec)
	if err != nil {
		t.Fatal(err)
	}
	var pluginSpecAsMapInterface map[string]interface{}
	if err := json.Unmarshal(data, &pluginSpecAsMapInterface); err != nil {
		t.Fatal(err)
	}
	testSuite := []struct {
		title  string
		jason  string
		result GlobalDatasource
	}{
		{
			title: "simple Prometheus datasource",
			jason: `
{
  "kind": "GlobalDatasource",
  "metadata": {
    "name": "PrometheusDemo"
  },
  "spec": {
    "default": true,
    "plugin": {
      "kind": "PrometheusDatasource",
      "spec": {
        "proxy": {
          "kind": "HTTPProxy",
          "spec": {
            "url": "https://prometheus.demo.do.prometheus.io"
          }
        }
      }
    }
  }
}
`,
			result: GlobalDatasource{
				Kind: KindGlobalDatasource,
				Metadata: Metadata{
					Name: "PrometheusDemo",
				},
				Spec: DatasourceSpec{
					Default: true,
					Plugin: common.Plugin{
						Kind: "PrometheusDatasource",
						Spec: pluginSpecAsMapInterface,
					},
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := GlobalDatasource{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLLayout(t *testing.T) {
	u, _ := url.Parse("https://prometheus.demo.do.prometheus.io")
	pluginSpec := &datasource.Prometheus{
		Proxy: datasourceHTTP.Proxy{
			Kind: "HTTPProxy",
			Spec: datasourceHTTP.Config{
				URL: u,
			},
		},
	}
	data, err := yaml.Marshal(pluginSpec)
	if err != nil {
		t.Fatal(err)
	}
	var pluginSpecAsMapInterface map[interface{}]interface{}
	if err := yaml.Unmarshal(data, &pluginSpecAsMapInterface); err != nil {
		t.Fatal(err)
	}
	testSuite := []struct {
		title  string
		yamele string
		result GlobalDatasource
	}{
		{
			title: "simple Prometheus datasource",
			yamele: `
kind: "GlobalDatasource"
metadata:
  name: "PrometheusDemo"
spec:
  default: true
  plugin:
    kind: PrometheusDatasource
    spec:
      proxy:
        kind: "HTTPProxy"
        spec:
          url: "https://prometheus.demo.do.prometheus.io"

`,
			result: GlobalDatasource{
				Kind: KindGlobalDatasource,
				Metadata: Metadata{
					Name: "PrometheusDemo",
				},
				Spec: DatasourceSpec{
					Default: true,
					Plugin: common.Plugin{
						Kind: "PrometheusDatasource",
						Spec: pluginSpecAsMapInterface,
					},
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := GlobalDatasource{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}
