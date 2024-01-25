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
	"encoding/json"
	"fmt"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/prometheus/common/model"
)

type PluginSpec struct {
	DirectURL      string         `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy          *http.Proxy    `json:"proxy,omitempty" yaml:"proxy,omitempty"`
	ScrapeInterval model.Duration `json:"scrapeInterval,omitempty" yaml:"scrapeInterval,omitempty"`
}

func (s *PluginSpec) UnmarshalJSON(data []byte) error {
	type plain PluginSpec
	var tmp PluginSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *PluginSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PluginSpec
	type plain PluginSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *PluginSpec) validate() error {
	if len(s.DirectURL) == 0 && s.Proxy == nil {
		return fmt.Errorf("directUrl or proxy cannot be empty")
	}
	if len(s.DirectURL) > 0 && s.Proxy != nil {
		return fmt.Errorf("at most directUrl or proxy must be configured")
	}
	return nil
}

func NewDatasourcePlugin() *DatasourcePlugin {
	return &DatasourcePlugin{
		PluginSpec: PluginSpec{},
	}
}

type DatasourcePlugin struct {
	PluginSpec
}

func (b *DatasourcePlugin) Build() common.Plugin {
	return common.Plugin{
		Kind: "PrometheusDatasource",
		Spec: b.PluginSpec,
	}
}

func (b *DatasourcePlugin) WithDirectUrl(url string) *DatasourcePlugin {
	b.PluginSpec = PluginSpec{
		DirectURL:      url,
		Proxy:          nil,
		ScrapeInterval: b.PluginSpec.ScrapeInterval,
	}
	return b
}

func (b *DatasourcePlugin) WithProxy(proxy http.Proxy) *DatasourcePlugin {
	b.PluginSpec =
		PluginSpec{
			Proxy:          &proxy,
			DirectURL:      "",
			ScrapeInterval: b.PluginSpec.ScrapeInterval,
		}
	return b
}

func (b *DatasourcePlugin) WithScrapeInterval(duration time.Duration) *DatasourcePlugin {
	b.PluginSpec.ScrapeInterval = model.Duration(duration)
	return b
}
