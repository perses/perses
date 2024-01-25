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

package prometheus_label_names

import (
	"github.com/perses/perses/go-sdk/prometheus/variables"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type PluginSpec struct {
	Datasource *variables.DatasourceSelector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Matchers   []string                      `json:"matchers,omitempty" yaml:"matchers,omitempty"`
}

func NewLabelNamesVariablePlugin() *ListVariablePluginBuilder {
	return &ListVariablePluginBuilder{
		PluginSpec: PluginSpec{},
	}
}

type ListVariablePluginBuilder struct {
	PluginSpec
}

func (b *ListVariablePluginBuilder) Build() common.Plugin {
	return common.Plugin{
		Kind: "PrometheusLabelNamesVariable",
		Spec: b.PluginSpec,
	}
}

func (b *ListVariablePluginBuilder) WithMatchers(matchers []string) *ListVariablePluginBuilder {
	b.Matchers = matchers
	return b
}

func (b *ListVariablePluginBuilder) AddMatcher(matcher string) *ListVariablePluginBuilder {
	b.Matchers = append(b.Matchers, matcher)
	return b
}

func (b *ListVariablePluginBuilder) WithDatasource(name string) *ListVariablePluginBuilder {
	b.Datasource = &variables.DatasourceSelector{
		Kind: "PrometheusDatasource",
		Name: name,
	}
	return b
}
