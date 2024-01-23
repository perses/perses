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
	"github.com/prometheus/common/model"
)

func NewDashboard(name string) *DashboardBuilder {
	return &DashboardBuilder{
		v1.Dashboard{
			Kind: v1.KindDashboard,
			Metadata: v1.ProjectMetadata{
				Metadata: v1.Metadata{
					Name: name,
				},
			},
			Spec: v1.DashboardSpec{
				Display:         nil,
				Datasources:     make(map[string]*v1.DatasourceSpec),
				Variables:       []dashboard.Variable{},
				Panels:          make(map[string]*v1.Panel),
				Layouts:         []dashboard.Layout{},
				Duration:        1 * 60 * 60, // 1 hour
				RefreshInterval: 5 * 60,      // 5 minutes
			},
		},
	}
}

func NewDashboardBuilder(dashboard v1.Dashboard) *DashboardBuilder {
	return &DashboardBuilder{dashboard}
}

type DashboardBuilder struct {
	v1.Dashboard
}

func (b *DashboardBuilder) Build() v1.Dashboard {
	return b.Dashboard
}

func (b *DashboardBuilder) GetEntity() modelAPI.Entity {
	return &b.Dashboard
}

func (b *DashboardBuilder) WithName(name string) *DashboardBuilder {
	// TODO: if contains space => display name
	b.Dashboard.Metadata.Name = name
	return b
}

func (b *DashboardBuilder) WithDescription(description string) *DashboardBuilder {
	if b.Dashboard.Spec.Display == nil {
		b.Dashboard.Spec.Display = &common.Display{}
	}
	b.Dashboard.Spec.Display.Description = description
	return b
}

func (b *DashboardBuilder) WithProject(project v1.Project) *DashboardBuilder {
	b.Dashboard.Metadata.Project = project.Metadata.Name
	return b
}

func (b *DashboardBuilder) WithProjectName(projectName string) *DashboardBuilder {
	b.Dashboard.Metadata.Project = projectName
	return b
}

func (b *DashboardBuilder) WithRefreshInterval(seconds int) *DashboardBuilder {
	b.Dashboard.Spec.RefreshInterval = model.Duration(seconds)
	return b
}

func (b *DashboardBuilder) WithDuration(seconds int) *DashboardBuilder {
	b.Dashboard.Spec.Duration = model.Duration(seconds)
	return b
}

func (b *DashboardBuilder) AddRow(row Row, panels []v1.Panel) *DashboardBuilder {
	if b.Dashboard.Spec.Layouts == nil {
		b.Dashboard.Spec.Layouts = []dashboard.Layout{}
	}

	if b.Dashboard.Spec.Panels == nil {
		b.Dashboard.Spec.Panels = make(map[string]*v1.Panel)
	}

	gridLayoutSpec := dashboard.GridLayoutSpec{
		Display: &dashboard.GridLayoutDisplay{
			Title:    row.Title,
			Collapse: &dashboard.GridLayoutCollapse{Open: !row.IsCollapsed},
		},
		Items: []dashboard.GridItem{},
	}

	for i := range panels {
		panelRef := fmt.Sprintf("%d_%d", len(b.Dashboard.Spec.Layouts), i)
		x := (len(gridLayoutSpec.Items) * row.PanelsWidth) % 24
		y := (len(gridLayoutSpec.Items) * row.PanelsWidth) / 24
		gridLayoutSpec.Items = append(gridLayoutSpec.Items, dashboard.GridItem{
			X:      x,
			Y:      y,
			Width:  row.PanelsWidth,
			Height: row.PanelsHeight,
			Content: &common.JSONRef{
				Ref: fmt.Sprintf("#/spec/panels/%s", panelRef),
			},
		})
		b.Dashboard.Spec.Panels[panelRef] = &panels[i]
	}

	b.Dashboard.Spec.Layouts = append(b.Dashboard.Spec.Layouts, dashboard.Layout{
		Kind: "Grid",
		Spec: gridLayoutSpec,
	})
	return b
}

func (b *DashboardBuilder) AddDatasource(datasource v1.Datasource) *DashboardBuilder {
	if b.Dashboard.Spec.Datasources == nil {
		b.Dashboard.Spec.Datasources = make(map[string]*v1.DatasourceSpec)
	}
	b.Dashboard.Spec.Datasources[datasource.Metadata.Name] = &datasource.Spec
	return b
}

func (b *DashboardBuilder) AddDatasources(datasources ...v1.Datasource) *DashboardBuilder {
	for _, datasource := range datasources {
		b.AddDatasource(datasource)
	}
	return b
}

func (b *DashboardBuilder) AddVariable(variable v1.Variable) *DashboardBuilder {
	if spec, ok := variable.Spec.Spec.(*dashboard.ListVariableSpec); ok {
		spec.Name = variable.Metadata.Name
		b.Dashboard.Spec.Variables = append(b.Dashboard.Spec.Variables, dashboard.Variable{
			Kind: variable.Spec.Kind,
			Spec: spec,
		})
		return b
	}

	if spec, ok := variable.Spec.Spec.(*dashboard.TextVariableSpec); ok {
		spec.Name = variable.Metadata.Name
		b.Dashboard.Spec.Variables = append(b.Dashboard.Spec.Variables, dashboard.Variable{
			Kind: variable.Spec.Kind,
			Spec: spec,
		})
		return b
	}
	// TODO: error?
	return b
}

func (b *DashboardBuilder) AddVariables(variables ...v1.Variable) *DashboardBuilder {
	for _, variable := range variables {
		b.AddVariable(variable)
	}
	return b
}

func (b *DashboardBuilder) Validate() error {
	// TODO
	return nil
}

func (b *DashboardBuilder) Complete() {
	// TODO
}
