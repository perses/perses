// Copyright 2025 The Perses Authors
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

package migrate

import (
	"strings"

	"cuelang.org/go/cue/build"
	"github.com/divan/num2words"
	"github.com/sirupsen/logrus"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
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
)

func (m *mig) migratePanels(grafanaDashboard *SimplifiedDashboard) (map[string]*v1.Panel, error) {
	panels := make(map[string]*v1.Panel)
	for i, p := range grafanaDashboard.Panels {
		if p.Type == grafanaPanelRowType {
			for j, innerPanel := range p.Panels {
				panel, err := m.migratePanel(innerPanel)
				if err != nil {
					return nil, err
				}
				panels[normalizePanelName(i, j)] = panel
			}
		} else {
			panel, err := m.migratePanel(p)
			if err != nil {
				return nil, err
			}
			panels[normalizePanelName(i)] = panel
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
	plugin, panelMigrationIsEmpty, err := executePanelMigrationScript(migrateScriptInstance, grafanaPanel.RawMessage)
	if err != nil {
		return nil, err
	}
	if panelMigrationIsEmpty {
		result.Spec.Plugin = defaultPanelPlugin
	} else {
		result.Spec.Plugin = *plugin
	}

	for _, target := range grafanaPanel.Targets {
		// For the moment, we are only supporting the migration of the TimeSeriesQuery.
		// That's something we will need to change at some point.
		// TODO This should be improved
		i := 0
		for ; i < len(m.queries); i++ {
			queryPlugin, queryMigrationIsEmpty, pluginErr := executeQueryMigrationScript(m.queries[i], target)
			if pluginErr != nil {
				logrus.WithError(pluginErr).Debug("failed to execute query migration script")
				continue
			}
			if !queryMigrationIsEmpty {
				result.Spec.Queries = append(result.Spec.Queries, v1.Query{
					Kind: "TimeSeriesQuery",
					Spec: v1.QuerySpec{
						Plugin: *queryPlugin,
					},
				})
				break
			}
		}
		if i == len(m.queries) {
			result.Spec.Queries = append(result.Spec.Queries, v1.Query{
				Kind: "TimeSeriesQuery",
				Spec: v1.QuerySpec{
					Plugin: defaultQueryPlugin,
				},
			})
		}
	}

	return result, nil
}

func executeQueryMigrationScript(cueScript *build.Instance, grafanaQueryData []byte) (*common.Plugin, bool, error) {
	return executeCuelangMigrationScript(cueScript, grafanaQueryData, "#target", "query")
}

func executePanelMigrationScript(cueScript *build.Instance, grafanaPanelData []byte) (*common.Plugin, bool, error) {
	return executeCuelangMigrationScript(cueScript, grafanaPanelData, "#panel", "panel")
}

// normalizePanelName convert from int to the word equivalent string
// this keeps the current pattern of using the indexes to create the panel
// names, but allows the Dashboard to be imported as a PersesDashboard CR
func normalizePanelName(index ...int) string {
	var name []string
	for _, n := range index {
		num := strings.ReplaceAll(num2words.Convert(n), "-", "_")
		name = append(name, num)
	}
	return strings.Join(name, "_")
}
