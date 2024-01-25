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

package prometheus_promql

import (
	"github.com/perses/perses/go-sdk/prometheus/variables"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type PluginSpec struct {
	Datasource *variables.DatasourceSelector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Expr       string                        `json:"expr" yaml:"expr"`
	LabelName  string                        `json:"labelName,omitempty" yaml:"labelName,omitempty"`
}

func NewPromQLVariablePlugin(expr string) *ListVariablePluginBuilder {
	return &ListVariablePluginBuilder{
		PluginSpec: PluginSpec{Expr: expr},
	}
}

type ListVariablePluginBuilder struct {
	PluginSpec
}

func (b *ListVariablePluginBuilder) Build() common.Plugin {
	return common.Plugin{
		Kind: "PrometheusPromQLVariable",
		Spec: b.PluginSpec,
	}
}

func (b *ListVariablePluginBuilder) WithExpr(expr string) *ListVariablePluginBuilder {
	b.Expr = expr
	return b
}

func (b *ListVariablePluginBuilder) WithLabelName(label string) *ListVariablePluginBuilder {
	b.LabelName = label
	return b
}

func (b *ListVariablePluginBuilder) WithDatasource(name string) *ListVariablePluginBuilder {
	b.Datasource = &variables.DatasourceSelector{
		Kind: "PrometheusDatasource",
		Name: name,
	}
	return b
}
