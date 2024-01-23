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
	modelAPI "github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
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

func NewTextVariable(name string) *TextVariableBuilder {
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
							Value:    "",
							Constant: false,
						},
						Name: name,
					},
				},
			},
		},
	}
}

type TextVariableBuilder struct {
	VariableBuilder
}

func (b *TextVariableBuilder) WithValue(value string) *TextVariableBuilder {
	textSpec, ok := b.Variable.Spec.Spec.(*dashboard.TextVariableSpec)
	if !ok {
		textSpec = &dashboard.TextVariableSpec{}
		b.Variable.Spec.Spec = textSpec
	}
	textSpec.Value = value
	return b
}

func (b *TextVariableBuilder) WithDisplayName(name string) *TextVariableBuilder {
	textSpec, ok := b.Variable.Spec.Spec.(*dashboard.TextVariableSpec)
	if !ok {
		textSpec = &dashboard.TextVariableSpec{}
		b.Variable.Spec.Spec = textSpec
	}
	if textSpec.Display == nil {
		textSpec.Display = &variable.Display{}
	}
	textSpec.Display.Name = name
	return b
}

func (b *TextVariableBuilder) WithDisplayDescription(desc string) *TextVariableBuilder {
	textSpec, ok := b.Variable.Spec.Spec.(*dashboard.TextVariableSpec)
	if !ok {
		textSpec = &dashboard.TextVariableSpec{}
		b.Variable.Spec.Spec = textSpec
	}
	if textSpec.Display == nil {
		textSpec.Display = &variable.Display{}
	}
	textSpec.Display.Description = desc
	return b
}

func (b *TextVariableBuilder) Hidden(isHidden bool) *TextVariableBuilder {
	textSpec, ok := b.Variable.Spec.Spec.(*dashboard.TextVariableSpec)
	if !ok {
		textSpec = &dashboard.TextVariableSpec{}
		b.Variable.Spec.Spec = textSpec
	}
	if textSpec.Display == nil {
		textSpec.Display = &variable.Display{}
	}
	textSpec.Display.Hidden = isHidden
	return b
}

func (b *TextVariableBuilder) Constant(isConstant bool) *TextVariableBuilder {
	textSpec, ok := b.Variable.Spec.Spec.(*dashboard.TextVariableSpec)
	if !ok {
		textSpec = &dashboard.TextVariableSpec{}
		b.Variable.Spec.Spec = textSpec
	}
	textSpec.Constant = isConstant
	return b
}

func NewListVariable(name string) *ListVariableBuilder {
	return &ListVariableBuilder{
		VariableBuilder{
			v1.Variable{
				Kind: v1.KindVariable,
				Metadata: v1.ProjectMetadata{
					Metadata: v1.Metadata{
						Name: name,
					},
				},
				Spec: v1.VariableSpec{
					Kind: "ListVariable",
					Spec: dashboard.ListVariableSpec{
						ListSpec: variable.ListSpec{},
						Name:     name,
					},
				},
			},
		},
	}
}

type ListVariableBuilder struct {
	VariableBuilder
}

func (b *ListVariableBuilder) WithDefaultValue(value string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.DefaultValue = &variable.DefaultValue{
		SingleValue: value,
	}
	return b
}

func (b *ListVariableBuilder) WithMultipleValues(enabled bool) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.AllowMultiple = enabled
	return b
}

func (b *ListVariableBuilder) WithAllValue(enabled bool) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.AllowAllValue = enabled
	return b
}

func (b *ListVariableBuilder) WithCustomAllValue(value string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.CustomAllValue = value
	return b
}

func (b *ListVariableBuilder) WithCapturingRegex(regex string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.CapturingRegexp = regex
	return b
}

func (b *ListVariableBuilder) SortingBy(sort variable.Sort) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.Sort = &sort
	return b
}

func (b *ListVariableBuilder) WithPlugin(plugin common.Plugin) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	listSpec.Plugin = plugin
	return b
}

func (b *ListVariableBuilder) WithDisplayName(name string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	if listSpec.Display == nil {
		listSpec.Display = &variable.Display{}
	}
	listSpec.Display.Name = name
	return b
}

func (b *ListVariableBuilder) WithDisplayDescription(desc string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	if listSpec.Display == nil {
		listSpec.Display = &variable.Display{}
	}
	listSpec.Display.Description = desc
	return b
}

func (b *ListVariableBuilder) Hidden(isHidden bool) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		listSpec = &dashboard.ListVariableSpec{}
		b.Variable.Spec.Spec = listSpec
	}
	if listSpec.Display == nil {
		listSpec.Display = &variable.Display{}
	}
	listSpec.Display.Hidden = isHidden
	return b
}
