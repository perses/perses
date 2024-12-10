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

package migratev2

import (
	"encoding/json"
	"fmt"
	"time"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"github.com/sirupsen/logrus"
)

var (
	defaultPanelPlugin = common.Plugin{
		Kind: "Markdown",
		Spec: &struct {
			Text string `json:"text"`
		}{
			Text: "**Migration from Grafana not supported !**",
		},
	}
	defaultQueryPlugin = common.Plugin{
		Kind: "PrometheusTimeSeriesQuery",
		Spec: &struct {
			Query string `json:"query"`
		}{
			Query: "migration_from_grafana_not_supported",
		},
	}
	defaultVariablePlugin = common.Plugin{
		Kind: "StaticListVariable",
		Spec: &struct {
			Values []string `json:"values"`
		}{
			Values: []string{"grafana", "migration", "not", "supported"},
		},
	}
)

func buildDefaultVariable(v TemplateVar) dashboard.Variable {
	return dashboard.Variable{
		Kind: variable.KindList,
		Spec: &dashboard.ListVariableSpec{
			ListSpec: variable.ListSpec{
				Plugin: defaultVariablePlugin,
				Display: &variable.Display{
					Name:        v.Label,
					Description: v.Description,
					Hidden:      v.Hide > 0,
				},
			},
			Name: v.Name,
		},
	}
}

func create(schemas config.Schemas) (*mig, error) {
	panels, err := loadPanels(schemas.PanelsPath)
	if err != nil {
		return nil, err
	}
	queries, err := loadSliceOfInstance(schemas.QueriesPath)
	if err != nil {
		return nil, err
	}
	variables, err := loadSliceOfInstance(schemas.VariablesPath)
	return &mig{
		panels:    panels,
		queries:   queries,
		variables: variables,
	}, nil
}

type mig struct {
	// panels is a map because we can decide which script to execute precisely.
	// This is because in Grafana a panel has a type.
	panels map[string]*build.Instance
	// Dynamic variables are usually in a parameter named 'query' in the Grafana data model and depending on what contains the query, then it will change the type of the plugin.
	// That would mean we would have to parse the string to know what script to use. Which means hardcoding things which is against the plugin philosophy.
	variables []*build.Instance
	queries   []*build.Instance
}

func (m *mig) Migrate(grafanaDashboard *SimplifiedDashboard) (*v1.Dashboard, error) {
	result := &v1.Dashboard{
		Kind: v1.KindDashboard,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: grafanaDashboard.UID,
			},
		},
		Spec: v1.DashboardSpec{
			Display: &common.Display{
				Name: grafanaDashboard.Title,
			},
			Duration: common.Duration(time.Hour),
		},
	}

	panels, err := m.migratePanels(grafanaDashboard)
	if err != nil {
		return nil, err
	}
	result.Spec.Panels = panels
	variables, err := m.migrateVariables(grafanaDashboard)
	if err != nil {
		return nil, err
	}
	result.Spec.Variables = variables
	result.Spec.Layouts = m.migrateGrid(grafanaDashboard)
	return result, nil
}

func (m *mig) migrateGrid(grafanaDashboard *SimplifiedDashboard) []dashboard.Layout {
	var result []dashboard.Layout

	// create a first grid to gather standalone panels if there are some (= only if the first encountered panel is not a row)
	if len(grafanaDashboard.Panels) > 0 && grafanaDashboard.Panels[0].Type != "row" {
		layout := dashboard.Layout{
			Kind: dashboard.KindGridLayout,
		}
		var items []dashboard.GridItem
		for i, panel := range grafanaDashboard.Panels {
			items = append(items, dashboard.GridItem{
				Width:  panel.GridPosition.Width,
				Height: panel.GridPosition.Height,
				X:      panel.GridPosition.X,
				Y:      panel.GridPosition.Y,
				Content: &common.JSONRef{
					Ref:  fmt.Sprintf("#/spec/panels/%d", i),
					Path: []string{"spec", "panels", fmt.Sprintf("%d", i)},
				},
			})
		}
		layout.Spec = &dashboard.GridLayoutSpec{
			Items: items,
		}
		result = append(result, layout)
	}

	// go through the top-level panels a 3rd time and match only the rows, to create the corresponding grids
	for i, panel := range grafanaDashboard.Panels {
		if panel.Type != "row" {
			continue
		}
		layout := dashboard.Layout{
			Kind: dashboard.KindGridLayout,
			Spec: &dashboard.GridLayoutSpec{
				Display: &dashboard.GridLayoutDisplay{
					Title: panel.Title,
					Collapse: &dashboard.GridLayoutCollapse{
						Open: !panel.Collapsed,
					},
				},
			},
		}
		var items []dashboard.GridItem
		for j, innerPanel := range panel.Panels {
			items = append(items, dashboard.GridItem{
				Width:  innerPanel.GridPosition.Width,
				Height: innerPanel.GridPosition.Height,
				X:      innerPanel.GridPosition.X,
				Y:      innerPanel.GridPosition.Y,
				Content: &common.JSONRef{
					Ref:  fmt.Sprintf("#/spec/panels/%d_%d", i, j),
					Path: []string{"spec", "panels", fmt.Sprintf("%d_%d", i, j)},
				},
			})
		}
		result = append(result, layout)
	}
	return result
}

func executeCuelangMigrationScript(cueScript *build.Instance, grafanaData []byte, defID string, typeOfDataToMigrate string) (*common.Plugin, bool, error) {
	ctx := cuecontext.New(cuecontext.EvaluatorVersion(cuecontext.EvalV3))
	grafanaValue := ctx.CompileString(fmt.Sprintf("%s: _", defID))
	grafanaValue = grafanaValue.FillPath(
		cue.ParsePath(defID),
		ctx.CompileBytes(grafanaData),
	)

	// Probably it is unnecessary to do that as JSON should be valid.
	// Otherwise, we won't be able to unmarshal the grafana dashboard.
	if err := grafanaValue.Validate(cue.Final()); err != nil {
		logrus.WithError(err).Trace("Unable to wrap the received json into a CUE definition")
		return nil, true, apiinterface.HandleBadRequestError(err.Error())
	}

	// Finally, execute the cuelang script with the static mapping and the Grafana Panel as a scope.
	finalVal := grafanaValue.Unify(ctx.BuildInstance(cueScript))
	if err := finalVal.Err(); err != nil {
		logrus.WithError(err).Debugf("Unable to compile the migration schema for the %s", typeOfDataToMigrate)
		return nil, true, apiinterface.HandleBadRequestError(fmt.Sprintf("unable to convert to Perses %s: %s", typeOfDataToMigrate, err))
	}
	return convertToPlugin(finalVal)
}

func convertToPlugin(migrateValue cue.Value) (*common.Plugin, bool, error) {
	if migrateValue.IsNull() {
		return nil, true, nil
	}
	data, err := migrateValue.MarshalJSON()
	if err != nil {
		return nil, true, err
	}
	if string(data) == "" || string(data) == "{}" {
		return nil, true, nil
	}
	plugin := &common.Plugin{}
	return plugin, false, json.Unmarshal(data, plugin)
}
