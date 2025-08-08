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
	"encoding/json"
	"fmt"

	"cuelang.org/go/cue/build"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
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
)

func (m *completeMigration) migratePanels(grafanaDashboard *SimplifiedDashboard) (map[string]*v1.Panel, error) {
	panels := make(map[string]*v1.Panel)
	for i, p := range grafanaDashboard.Panels {
		if p.Type == grafanaPanelRowType {
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

func (m *completeMigration) migratePanel(grafanaPanel Panel) (*v1.Panel, error) {
	result := &v1.Panel{
		Kind: string(plugin.KindPanel),
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
	// first try to load the migration script from the dev migration instance.
	migrateScriptInstance, ok := m.devMig.panels[grafanaPanel.Type]
	if !ok {
		// if not found, try to load the migration script from the prod migration instance.
		migrateScriptInstance, ok = m.mig.panels[grafanaPanel.Type]
		if !ok {
			result.Spec.Plugin = defaultPanelPlugin
			return result, nil
		}
	}
	panelPlugin, panelMigrationIsEmpty, err := executePanelMigrationScript(migrateScriptInstance.instance, grafanaPanel.RawMessage)
	if err != nil {
		return nil, err
	}
	if panelMigrationIsEmpty {
		result.Spec.Plugin = defaultPanelPlugin
	} else {
		result.Spec.Plugin = *panelPlugin
	}
	m.migrateQueries(grafanaPanel.Targets, result)

	return result, nil
}

func (m *completeMigration) migrateQueries(targets []json.RawMessage, result *v1.Panel) {
	// As Grafana does not provide a type of their queries, we can only execute every query migration script hoping there is only one that matches the target.
	for _, target := range targets {
		// We try first to execute the migration script from the dev migration instance.
		isQueryMigrationEmpty := migrateQuery(m.devMig.queries, target, result)
		if isQueryMigrationEmpty {
			// If the migration failed, we tried again with the prod migration instance.
			isQueryMigrationEmpty = migrateQuery(m.mig.queries, target, result)
			if isQueryMigrationEmpty {
				result.Spec.Queries = append(result.Spec.Queries, v1.Query{
					Kind: string(plugin.KindTimeSeriesQuery),
					Spec: v1.QuerySpec{
						Plugin: defaultQueryPlugin,
					},
				})
			}
		}
	}
}

func migrateQuery(queries map[string]*queryInstance, target json.RawMessage, result *v1.Panel) bool {
	isQueryMigrationEmpty := true
	for _, query := range queries {
		queryPlugin, queryMigrationIsEmpty, pluginErr := executeQueryMigrationScript(query.instance, target)
		if pluginErr != nil {
			logrus.WithError(pluginErr).Debug("failed to execute query migration script")
			continue
		}
		if !queryMigrationIsEmpty {
			result.Spec.Queries = append(result.Spec.Queries, v1.Query{
				Kind: string(query.kind),
				Spec: v1.QuerySpec{
					Plugin: *queryPlugin,
				},
			})
			isQueryMigrationEmpty = false
			break
		}
	}
	return isQueryMigrationEmpty
}

func executeQueryMigrationScript(cueScript *build.Instance, grafanaQueryData []byte) (*common.Plugin, bool, error) {
	return ExecuteCuelangMigrationScript(cueScript, grafanaQueryData, "#target", "query")
}

func executePanelMigrationScript(cueScript *build.Instance, grafanaPanelData []byte) (*common.Plugin, bool, error) {
	return ExecuteCuelangMigrationScript(cueScript, grafanaPanelData, "#panel", "panel")
}
