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

package promql

import (
	"github.com/perses/perses/go-sdk/datasource"
	list_variable "github.com/perses/perses/go-sdk/variable/list-variable"
)

type PluginSpec struct {
	Datasource *datasource.Selector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Expr       string               `json:"expr" yaml:"expr"`
	LabelName  string               `json:"labelName,omitempty" yaml:"labelName,omitempty"`
}

type Option func(plugin *Builder) error

func create(expr string, options ...Option) (Builder, error) {
	var builder = &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Expr(expr),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

func PrometheusPromQL(expr string, options ...Option) list_variable.Option {
	return func(builder *list_variable.Builder) error {
		t, err := create(expr, options...)
		if err != nil {
			return err
		}
		builder.ListVariableSpec.Plugin.Kind = "PrometheusPromQLVariable"
		builder.ListVariableSpec.Plugin.Spec = t
		return nil
	}
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}
