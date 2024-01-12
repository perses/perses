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

package prometheus_promql

import (
	"fmt"

	"github.com/perses/perses/go-sdk"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/sirupsen/logrus"
)

type datasourceSelector struct {
	Kind string
	Name *string
}

type PluginSpec struct {
	Datasource datasourceSelector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Expr       string
	LabelName  *string
}

func NewPrometheusPromQLVariable(name string, expr string) *ListVariableBuilder {
	return &ListVariableBuilder{
		ListVariableBuilder: sdk.ListVariableBuilder{
			VariableBuilder: sdk.VariableBuilder{
				Variable: v1.Variable{
					Kind: v1.KindVariable,
					Metadata: v1.ProjectMetadata{
						Metadata: v1.Metadata{
							Name: name,
						},
					},
					Spec: v1.VariableSpec{
						Kind: "ListVariable",
						Spec: dashboard.ListVariableSpec{
							ListSpec: variable.ListSpec{
								Display:         nil,
								DefaultValue:    nil,
								AllowAllValue:   false,
								AllowMultiple:   false,
								CustomAllValue:  "",
								CapturingRegexp: "",
								Sort:            nil,
								Plugin: common.Plugin{
									Kind: "PrometheusLabelNamesVariable",
									Spec: PluginSpec{Expr: expr},
								},
							},
							Name: name,
						},
					},
				},
			},
		},
	}
}

type ListVariableBuilder struct {
	sdk.ListVariableBuilder
}

func (b *ListVariableBuilder) WithExpr(expr string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set expr: %q", expr))
		return b
	}
	pluginSpec, ok := listSpec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set expr: %q", expr))
		return b
	}
	pluginSpec.Expr = expr
	return b
}

func (b *ListVariableBuilder) WithLabelName(label string) *ListVariableBuilder {
	listSpec, ok := b.Variable.Spec.Spec.(*dashboard.ListVariableSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set label name: %q", label))
		return b
	}
	pluginSpec, ok := listSpec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set label name: %q", label))
		return b
	}
	pluginSpec.LabelName = &label
	return b
}
