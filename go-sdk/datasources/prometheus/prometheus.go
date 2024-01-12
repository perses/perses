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

package prometheus

import (
	"fmt"
	"net/url"

	"github.com/perses/perses/go-sdk"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
)

type PluginSpec struct {
	DirectURL      *string         `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy          *http.Proxy     `json:"proxy,omitempty" yaml:"proxy,omitempty"`
	ScrapeInterval *model.Duration `json:"scrapeInterval,omitempty" yaml:"scrapeInterval,omitempty"`
}

func NewDatasource(name string, url string) *DatasourceBuilder {
	return &DatasourceBuilder{
		sdk.DatasourceBuilder{
			Datasource: v1.Datasource{
				Kind: v1.KindDatasource,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: name,
					},
				},
				Spec: v1.DatasourceSpec{
					Display: nil,
					Default: false,
					Plugin: common.Plugin{
						Kind: "PrometheusDatasource",
						Spec: &PluginSpec{
							DirectURL: &url,
						},
					},
				},
			},
		},
	}
}

type DatasourceBuilder struct {
	sdk.DatasourceBuilder
}

func (b *DatasourceBuilder) WithDirectUrl(url string) (*DatasourceBuilder, error) {
	b.Datasource.Spec.Plugin.Spec = &PluginSpec{
		DirectURL: &url,
		Proxy:     nil,
	}
	return b, nil
}

func (b *DatasourceBuilder) WithHTTPProxy(proxyURL string) (*DatasourceBuilder, error) {
	u, err := url.Parse(proxyURL)
	if err != nil {
		return b, err
	}

	b.Datasource.Spec.Plugin.Spec = &PluginSpec{
		Proxy: &http.Proxy{
			Kind: "HTTPProxy",
			Spec: http.Config{
				URL: u,
			},
		},
		DirectURL: nil,
	}
	return b, nil
}

func (b *DatasourceBuilder) WithScrapeInterval(seconds int) *DatasourceBuilder {
	pluginSpec, ok := b.Datasource.Spec.Plugin.Spec.(*datasource.Prometheus)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set scrape interval: %q", seconds))
		return b
	}
	duration := model.Duration(seconds)
	pluginSpec.ScrapeInterval = &duration
	return b
}
