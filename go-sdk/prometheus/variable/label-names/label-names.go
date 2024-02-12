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

package labelnames

import (
	"fmt"
	"strings"

	"github.com/perses/perses/go-sdk/datasource"
	list_variable "github.com/perses/perses/go-sdk/variable/list-variable"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type PluginSpec struct {
	Datasource *datasource.Selector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Matchers   []string             `json:"matchers,omitempty" yaml:"matchers,omitempty"`
}

type Option func(plugin *Builder) error

func New(options ...Option) (Builder, error) {
	var builder = &Builder{
		PluginSpec: PluginSpec{},
	}

	for _, opt := range options {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	if err := builder.ApplyFilters(); err != nil {
		return *builder, err
	}

	return *builder, nil
}

func PrometheusLabelNames(options ...Option) list_variable.Option {
	return func(builder *list_variable.Builder) error {
		options = append([]Option{Filter(builder.Filters...)}, options...)
		t, err := New(options...)
		if err != nil {
			return err
		}
		builder.ListVariableSpec.Plugin.Kind = "PrometheusLabelNamesVariable"
		builder.ListVariableSpec.Plugin.Spec = t
		return nil
	}
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
	Filters    []v1.Variable `json:"-" yaml:"-"`
}

func (b *Builder) ApplyFilters() error {
	var filters []string
	for _, variables := range b.Filters {
		filters = append(filters, fmt.Sprintf("%s=\"$%s\"", variables.Metadata.Name, variables.Metadata.Name))
	}

	for index, matcher := range b.PluginSpec.Matchers {
		// Add filter if matcher do not already have metric filter
		if !strings.Contains(matcher, "{") {
			b.PluginSpec.Matchers[index] = fmt.Sprintf("%s{%s}", matcher, strings.Join(filters, ","))
		}
	}
	return nil
}
