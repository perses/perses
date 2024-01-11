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
		},
	}
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

func (b *DashboardBuilder) WithVersion(version uint64) *DashboardBuilder {
	b.Dashboard.Metadata.Version = version
	return b
}

func (b *DashboardBuilder) AddRow(rb *RowBuilder) *DashboardBuilder {
	if rb == nil {
		return b
	}

	if b.Dashboard.Spec.Layouts == nil {
		b.Dashboard.Spec.Layouts = []dashboard.Layout{}
	}

	if b.Dashboard.Spec.Panels == nil {
		b.Dashboard.Spec.Panels = make(map[string]*v1.Panel)
	}

	for i := range rb.grid.Items {
		panelRef := fmt.Sprintf("%d_%d", len(b.Dashboard.Spec.Layouts), i)
		rb.grid.Items[i].Content.Ref = fmt.Sprintf("#/spec/panels/%s", panelRef)
		b.Dashboard.Spec.Panels[panelRef] = &rb.panels[i]
	}

	b.Dashboard.Spec.Layouts = append(b.Dashboard.Spec.Layouts, dashboard.Layout{
		Kind: "Grid",
		Spec: rb.grid,
	})

	return b
}

func (b *DashboardBuilder) AddPanel(panel v1.Panel) *DashboardBuilder {
	if b.Dashboard.Spec.Layouts == nil {
		b.Dashboard.Spec.Layouts = []dashboard.Layout{}
	}

	if len(b.Dashboard.Spec.Layouts) == 0 {
		b.Dashboard.Spec.Layouts = append(b.Dashboard.Spec.Layouts, dashboard.Layout{
			Kind: "Grid",
			Spec: dashboard.GridLayoutSpec{
				Display: nil,
				Items:   nil,
			},
		})
	}

	// TODO: Check how to handle layout
	if b.Dashboard.Spec.Panels == nil {
		b.Dashboard.Spec.Panels = make(map[string]*v1.Panel)
	}
	b.Dashboard.Spec.Panels["0_0"] = &panel
	return b
}

func (b *DashboardBuilder) AddDatasource(datasource v1.Datasource) *DashboardBuilder {
	if b.Dashboard.Spec.Datasources == nil {
		b.Dashboard.Spec.Datasources = make(map[string]*v1.DatasourceSpec)
	}
	b.Dashboard.Spec.Datasources[datasource.Metadata.Name] = &datasource.Spec
	return b
}
