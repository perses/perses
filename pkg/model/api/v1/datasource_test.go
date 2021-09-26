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
	"net/http"
	"net/url"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONDatasource(t *testing.T) {
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
    "kind": "Prometheus",
    "default": true,
    "http": {
      "url": "https://prometheus.demo.do.prometheus.io"
    }
  }
}
`,
			result: GlobalDatasource{
				Kind: KindGlobalDatasource,
				Metadata: Metadata{
					Name: "PrometheusDemo",
				},
				Spec: &datasource.Prometheus{
					BasicDatasource: datasource.BasicDatasource{
						Kind:    datasource.PrometheusKind,
						Default: true,
					},
					HTTP: datasource.HTTPConfig{
						URL: &url.URL{
							Scheme: "https",
							Host:   "prometheus.demo.do.prometheus.io",
						},
						Access: datasource.ServerHTTPAccess,
						AllowedEndpoints: []datasource.HTTPAllowedEndpoint{
							{
								Endpoint: "/api/v1/labels",
								Method:   http.MethodPost,
							},
							{
								Endpoint: "/api/v1/series",
								Method:   http.MethodPost,
							},
							{
								Endpoint: "/api/v1/metadata",
								Method:   http.MethodGet,
							},
							{
								Endpoint: "/api/v1/query",
								Method:   http.MethodPost,
							},
							{
								Endpoint: "/api/v1/query_range",
								Method:   http.MethodPost,
							},
						},
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
	testSuite := []struct {
		title  string
		yamele string
		result GlobalDatasource
	}{
		{
			title: "simple Prometheus datasource",
			yamele: `
kind: GlobalDatasource
metadata:
  name: "PrometheusDemo" 
spec:
  kind: Prometheus
  default: true
  http:
    url: "https://prometheus.demo.do.prometheus.io"
`,
			result: GlobalDatasource{
				Kind: KindGlobalDatasource,
				Metadata: Metadata{
					Name: "PrometheusDemo",
				},
				Spec: &datasource.Prometheus{
					BasicDatasource: datasource.BasicDatasource{
						Kind:    datasource.PrometheusKind,
						Default: true,
					},
					HTTP: datasource.HTTPConfig{
						URL: &url.URL{
							Scheme: "https",
							Host:   "prometheus.demo.do.prometheus.io",
						},
						Access: datasource.ServerHTTPAccess,
						AllowedEndpoints: []datasource.HTTPAllowedEndpoint{
							{
								Endpoint: "/api/v1/labels",
								Method:   http.MethodPost,
							},
							{
								Endpoint: "/api/v1/series",
								Method:   http.MethodPost,
							},
							{
								Endpoint: "/api/v1/metadata",
								Method:   http.MethodGet,
							},
							{
								Endpoint: "/api/v1/query",
								Method:   http.MethodPost,
							},
							{
								Endpoint: "/api/v1/query_range",
								Method:   http.MethodPost,
							},
						},
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
