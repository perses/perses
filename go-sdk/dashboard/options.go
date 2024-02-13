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

package dashboard

import (
	"fmt"
	"time"

	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/perses/go-sdk/variable"
	"github.com/perses/perses/go-sdk/variable-group"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	v1Dashboard "github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/prometheus/common/model"
)

func Name(name string) Option {
	return func(builder *Builder) error {
		if err := common.ValidateID(name); err != nil {
			if builder.Dashboard.Spec.Display == nil {
				builder.Dashboard.Spec.Display = &common.Display{}
			}
			builder.Dashboard.Spec.Display.Name = name
		} else {
			builder.Dashboard.Metadata.Name = name
		}
		return nil
	}
}

func ProjectName(name string) Option {
	return func(builder *Builder) error {
		builder.Dashboard.Metadata.Project = name
		return nil
	}
}

func RefreshInterval(seconds time.Duration) Option {
	return func(builder *Builder) error {
		builder.Dashboard.Spec.RefreshInterval = model.Duration(seconds)
		return nil
	}
}

func Duration(seconds time.Duration) Option {
	return func(builder *Builder) error {
		builder.Dashboard.Spec.Duration = model.Duration(seconds)
		return nil
	}
}

func AddPanelGroup(title string, options ...panelgroup.Option) Option {
	return func(builder *Builder) error {
		r, err := panelgroup.New(title, options...)
		if err != nil {
			return err
		}

		if builder.Dashboard.Spec.Layouts == nil {
			builder.Dashboard.Spec.Layouts = []dashboard.Layout{}
		}

		if builder.Dashboard.Spec.Panels == nil {
			builder.Dashboard.Spec.Panels = make(map[string]*v1.Panel)
		}

		gridLayoutSpec := v1Dashboard.GridLayoutSpec{
			Display: &dashboard.GridLayoutDisplay{
				Title: r.Title,
			},
			Items: []dashboard.GridItem{},
		}

		if !r.IsCollapsed {
			gridLayoutSpec.Display.Collapse = &dashboard.GridLayoutCollapse{Open: true}
		}

		for i := range r.Panels {
			panelRef := fmt.Sprintf("%d_%d", len(builder.Dashboard.Spec.Layouts), i)
			x := (len(gridLayoutSpec.Items) * r.PanelsWidth) % 24
			y := (len(gridLayoutSpec.Items) * r.PanelsWidth) / 24
			gridLayoutSpec.Items = append(gridLayoutSpec.Items, v1Dashboard.GridItem{
				X:      x,
				Y:      y,
				Width:  r.PanelsWidth,
				Height: r.PanelsHeight,
				Content: &common.JSONRef{
					Ref: fmt.Sprintf("#/spec/panels/%s", panelRef),
				},
			})
			builder.Dashboard.Spec.Panels[panelRef] = &r.Panels[i]
		}

		builder.Dashboard.Spec.Layouts = append(builder.Dashboard.Spec.Layouts, v1Dashboard.Layout{
			Kind: "Grid",
			Spec: gridLayoutSpec,
		})

		return nil
	}
}

func AddDatasource(name string, options ...datasource.Option) Option {
	return func(builder *Builder) error {
		ds, err := datasource.New(name, options...)
		if err != nil {
			return err
		}
		if builder.Dashboard.Spec.Datasources == nil {
			builder.Dashboard.Spec.Datasources = make(map[string]*v1.DatasourceSpec)
		}
		builder.Dashboard.Spec.Datasources[name] = &ds.Datasource.Spec
		return nil
	}
}

func AddVariable(name string, options ...variable.Option) Option {
	return func(builder *Builder) error {
		v, err := variable.New(name, options...)
		if err != nil {
			return err
		}

		if spec, ok := v.Variable.Spec.Spec.(dashboard.ListVariableSpec); ok {
			spec.Name = v.Variable.Metadata.Name
			builder.Dashboard.Spec.Variables = append(builder.Dashboard.Spec.Variables, dashboard.Variable{
				Kind: v.Variable.Spec.Kind,
				Spec: &spec,
			})
			return nil
		}

		if spec, ok := v.Variable.Spec.Spec.(dashboard.TextVariableSpec); ok {
			spec.Name = v.Variable.Metadata.Name
			builder.Dashboard.Spec.Variables = append(builder.Dashboard.Spec.Variables, dashboard.Variable{
				Kind: v.Variable.Spec.Kind,
				Spec: &spec,
			})
			return nil
		}
		return fmt.Errorf("unknown variable spec %+v", v.Variable.Spec.Spec)
	}
}

func AddVariableGroup(options ...variablegroup.Option) Option {
	return func(builder *Builder) error {

		g, err := variablegroup.New(options...)
		if err != nil {
			return err
		}

		for _, v := range g.Variables {
			if spec, ok := v.Spec.Spec.(dashboard.ListVariableSpec); ok {
				spec.Name = v.Metadata.Name
				builder.Dashboard.Spec.Variables = append(builder.Dashboard.Spec.Variables, dashboard.Variable{
					Kind: v.Spec.Kind,
					Spec: &spec,
				})
			} else if spec, ok := v.Spec.Spec.(dashboard.TextVariableSpec); ok {
				spec.Name = v.Metadata.Name
				builder.Dashboard.Spec.Variables = append(builder.Dashboard.Spec.Variables, dashboard.Variable{
					Kind: v.Spec.Kind,
					Spec: &spec,
				})
			} else {
				return fmt.Errorf("unknown variable spec %+v", v.Spec.Spec)
			}
		}
		return nil
	}
}
