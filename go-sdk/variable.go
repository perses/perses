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

package sdk

import (
	"fmt"

	modelAPI "github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/sirupsen/logrus"
)

type VariableBuilder struct {
	v1.Variable
}

func (b *VariableBuilder) Build() v1.Variable {
	return b.Variable
}

func (b *VariableBuilder) GetEntity() modelAPI.Entity {
	return &b.Variable
}

func (b *VariableBuilder) WithName(name string) *VariableBuilder {
	b.Variable.Metadata.Name = name
	return b
}

func (b *VariableBuilder) WithProject(project v1.Project) *VariableBuilder {
	b.Variable.Metadata.Project = project.Metadata.Name
	return b
}

func (b *VariableBuilder) WithProjectName(projectName string) *VariableBuilder {
	b.Variable.Metadata.Project = projectName
	return b
}

func (b *VariableBuilder) WithVersion(version uint64) *VariableBuilder {
	b.Variable.Metadata.Version = version
	return b
}

func NewTextVariable(name string, value string) *TextVariableBuilder {
	return &TextVariableBuilder{
		VariableBuilder{
			v1.Variable{
				Kind: v1.KindVariable,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: name,
					},
				},
				Spec: v1.VariableSpec{
					Kind: "TextVariable",
					Spec: dashboard.TextVariableSpec{
						TextSpec: variable.TextSpec{
							Display:  nil,
							Value:    value,
							Constant: false,
						},
						Name: name,
					},
				},
			},
		},
	}
}

func NewTextVariableBuilder(variable v1.Variable) *TextVariableBuilder {
	return &TextVariableBuilder{VariableBuilder{variable}}
}

type TextVariableBuilder struct {
	VariableBuilder
}

func (b *TextVariableBuilder) WithValue(value string) *TextVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.TextVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set value: %q", value))
		return b
	}
	listSpec.Value = value
	return b
}

type ListVariableBuilder struct {
	VariableBuilder
}

func (b *ListVariableBuilder) WithDefaultValue(value string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set default value: %q", value))
		return b
	}
	listSpec.DefaultValue = &variable.DefaultValue{
		SingleValue: value,
	}
	return b
}

func (b *ListVariableBuilder) WithMultipleValues(enabled bool) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to enable multiple values: %t", enabled))
		return b
	}
	listSpec.AllowMultiple = enabled
	return b
}

func (b *ListVariableBuilder) WithAllValue(enabled bool) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to enable all values: %t", enabled))
		return b
	}
	listSpec.AllowAllValue = enabled
	return b
}

func (b *ListVariableBuilder) WithCustomAllValue(value string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set custom all value: %q", value))
		return b
	}
	listSpec.CustomAllValue = value
	return b
}

func (b *ListVariableBuilder) WithCapturingRegex(regex string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set capturing regex: %q", regex))
		return b
	}
	listSpec.CapturingRegexp = regex
	return b
}

func (b *ListVariableBuilder) SortingBy(sort variable.Sort) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set sort: %q", sort))
		return b
	}
	listSpec.Sort = &sort
	return b
}

func (b *ListVariableBuilder) WithPlugin(plugin common.Plugin) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set plugin: %q", plugin))
		return b
	}
	listSpec.Plugin = plugin
	return b
}
