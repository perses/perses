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

package prometheus_label_values

import "github.com/perses/perses/pkg/model/api/v1/common"

type datasourceSelector struct {
	Kind string `json:"kind" yaml:"kind"`
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
}

type PluginSpec struct {
	Datasource *datasourceSelector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	LabelName  string              `json:"labelName" yaml:"labelName"`
	Matchers   []string            `json:"matchers,omitempty" yaml:"matchers,omitempty"`
}

func NewLabelValuesVariablePlugin(labelName string) *ListVariablePluginBuilder {
	return &ListVariablePluginBuilder{
		PluginSpec: PluginSpec{LabelName: labelName},
	}
}

type ListVariablePluginBuilder struct {
	PluginSpec
}

func (b *ListVariablePluginBuilder) Build() common.Plugin {
	return common.Plugin{
		Kind: "PrometheusLabelValuesVariable",
		Spec: b.PluginSpec,
	}
}

func (b *ListVariablePluginBuilder) WithLabelName(label string) *ListVariablePluginBuilder {
	b.LabelName = label
	return b
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
	b.Datasource = &datasourceSelector{
		Kind: "PrometheusDatasource",
		Name: name,
	}
	return b
}
