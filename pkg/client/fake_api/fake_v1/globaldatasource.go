// Copyright 2022 The Perses Authors
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

package fake_v1

import (
	"net/url"
	"strings"

	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
)

func GlobalDatasourceList(prefix string) []*modelV1.GlobalDatasource {
	u, _ := url.Parse("https://prometheus.demo.do.prometheus.io")
	localURL, _ := url.Parse("http://localhost:9090")
	initialList := []*modelV1.GlobalDatasource{
		{
			Kind: modelV1.KindGlobalDatasource,
			Metadata: modelV1.Metadata{
				Name: "PrometheusDemo",
			},
			Spec: &datasource.Prometheus{
				BasicDatasource: datasource.BasicDatasource{
					Kind:    datasource.PrometheusKind,
					Default: false,
				},
				HTTP: datasource.HTTPConfig{
					URL:    u,
					Access: datasource.ServerHTTPAccess,
				},
			},
		},
		{
			Kind: modelV1.KindGlobalDatasource,
			Metadata: modelV1.Metadata{
				Name: "PrometheusDemoBrowser",
			},
			Spec: &datasource.Prometheus{
				BasicDatasource: datasource.BasicDatasource{
					Kind:    datasource.PrometheusKind,
					Default: false,
				},
				HTTP: datasource.HTTPConfig{
					URL:    u,
					Access: datasource.BrowserHTTPAccess,
				},
			},
		},
		{
			Kind: modelV1.KindGlobalDatasource,
			Metadata: modelV1.Metadata{
				Name: "PrometheusLocal",
			},
			Spec: &datasource.Prometheus{
				BasicDatasource: datasource.BasicDatasource{
					Kind:    datasource.PrometheusKind,
					Default: false,
				},
				HTTP: datasource.HTTPConfig{
					URL:    localURL,
					Access: datasource.ServerHTTPAccess,
				},
			},
		},
	}
	var result []*modelV1.GlobalDatasource
	for _, p := range initialList {
		if len(prefix) == 0 || strings.HasPrefix(p.Metadata.Name, prefix) {
			result = append(result, p)
		}
	}
	return result
}

type globalDatasource struct {
	v1.GlobalDatasourceInterface
}

func (c *globalDatasource) Create(entity *modelV1.GlobalDatasource) (*modelV1.GlobalDatasource, error) {
	return entity, nil
}

func (c *globalDatasource) Update(entity *modelV1.GlobalDatasource) (*modelV1.GlobalDatasource, error) {
	return entity, nil
}

func (c *globalDatasource) Delete(_ string) error {
	return nil
}

func (c *globalDatasource) Get(name string) (*modelV1.GlobalDatasource, error) {
	return &modelV1.GlobalDatasource{
		Kind: modelV1.KindGlobalDatasource,
		Metadata: modelV1.Metadata{
			Name: name,
		},
		Spec: nil,
	}, nil
}

func (c *globalDatasource) List(prefix string) ([]*modelV1.GlobalDatasource, error) {
	return GlobalDatasourceList(prefix), nil
}
