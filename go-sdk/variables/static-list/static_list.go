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

package staticlist

import (
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type PluginSpec struct {
	Values []string `json:"values" yaml:"values"`
}

func NewListVariablePlugin() *VariableSpecBuilder {
	return &VariableSpecBuilder{
		PluginSpec: PluginSpec{
			Values: []string{},
		},
	}
}

type VariableSpecBuilder struct {
	PluginSpec
}

func (b *VariableSpecBuilder) Build() common.Plugin {
	return common.Plugin{
		Kind: "StaticListVariable",
		Spec: b.PluginSpec,
	}
}

func (b *VariableSpecBuilder) WithValues(values []string) *VariableSpecBuilder {
	b.Values = values
	return b
}

func (b *VariableSpecBuilder) AddValue(values string) *VariableSpecBuilder {
	b.Values = append(b.Values, values)
	return b
}
