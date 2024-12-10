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
	_ "embed"
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
	"github.com/sirupsen/logrus"
)

var (
	defaultPanelPlugin = common.Plugin{
		Kind: "Markdown",
		Spec: struct {
			Text string `json:"text"`
		}{
			Text: "**Migration from Grafana not supported !**",
		},
	}
)

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

func (m *mig) migratePanels(grafanaDashboard *SimplifiedDashboard) (map[string]*v1.Panel, error) {
	panels := make(map[string]*v1.Panel)
	for i, p := range grafanaDashboard.Panels {
		if p.Type == "row" {
			for j, innerPanel := range p.Panels {
				panel, err := m.migratePanel(innerPanel)
				if err != nil {
					return nil, err
				}
				panels[fmt.Sprintf("%d_%d", i, j)] = panel
			}
		} else {
			panel, err := m.migratePanel(p)
			if err != nil {
				return nil, err
			}
			panels[fmt.Sprintf("%d", i)] = panel
		}
	}
	return panels, nil
}

func (m *mig) migratePanel(grafanaPanel Panel) (*v1.Panel, error) {
	result := &v1.Panel{
		Kind: "Panel",
		Spec: v1.PanelSpec{
			Display: v1.PanelDisplay{
				Name:        "empty",
				Description: grafanaPanel.Description,
			},
		},
	}
	if len(grafanaPanel.Title) > 0 {
		result.Spec.Display.Name = grafanaPanel.Title
	}
	migrateScriptInstance, ok := m.panels[grafanaPanel.Type]
	if !ok {
		result.Spec.Plugin = defaultPanelPlugin
		return result, nil
	}
	plugin, err := executePanelMigrationScript(migrateScriptInstance, grafanaPanel.RawMessage)
	if err != nil {
		return nil, err
	}
	result.Spec.Plugin = *plugin

	for _, target := range grafanaPanel.Targets {
		// For the moment, we are only supporting the migration of the TimeSeriesQuery.
		// That's something we will need to change at some point.
		// TODO This should be improved
		for _, script := range m.queries {
			queryPlugin, pluginErr := executeQueryMigrationScript(script, target)
			if pluginErr != nil {
				return nil, pluginErr
			}
			result.Spec.Queries = append(result.Spec.Queries, v1.Query{
				Kind: "TimeSeriesQuery",
				Spec: v1.QuerySpec{
					Plugin: *queryPlugin,
				},
			})
			break
		}
	}

	return result, nil
}

func executeQueryMigrationScript(cueScript *build.Instance, grafanaQueryData []byte) (*common.Plugin, error) {
	return executeCuelangMigrationScript(cueScript, grafanaQueryData, "#target")
}

func executePanelMigrationScript(cueScript *build.Instance, grafanaPanelData []byte) (*common.Plugin, error) {
	return executeCuelangMigrationScript(cueScript, grafanaPanelData, "#panel")
}

func executeCuelangMigrationScript(cueScript *build.Instance, grafanaData []byte, defID string) (*common.Plugin, error) {
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
		return nil, apiinterface.HandleBadRequestError(err.Error())
	}

	// Finally, execute the cuelang script with the static mapping and the Grafana Panel as a scope.
	finalVal := grafanaValue.Unify(ctx.BuildInstance(cueScript))
	if err := finalVal.Err(); err != nil {
		logrus.WithError(err).Debug("Unable to compile the migration schema for the panel")
		return nil, apiinterface.HandleBadRequestError(fmt.Sprintf("unable to convert to Perses panel: %s", err))
	}
	return convertToPlugin(finalVal)
}

func convertToPlugin(migrateValue cue.Value) (*common.Plugin, error) {
	data, err := migrateValue.MarshalJSON()
	if err != nil {
		return nil, err
	}
	plugin := &common.Plugin{}
	return plugin, json.Unmarshal(data, plugin)
}
