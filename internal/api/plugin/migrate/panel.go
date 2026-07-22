// Copyright The Perses Authors
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
	"regexp"
	"strings"

	"cuelang.org/go/cue/build"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/plugin"
	"github.com/sirupsen/logrus"
)

var (
	defaultPanelPlugin = plugin.Plugin{
		Kind: "Markdown",
		Spec: &struct {
			Text string `json:"text"`
		}{
			Text: "**Migration from Grafana not supported !**",
		},
	}
	defaultQueryPlugin = plugin.Plugin{
		Kind: "PrometheusTimeSeriesQuery",
		Spec: &struct {
			Query string `json:"query"`
		}{
			Query: "migration_from_grafana_not_supported",
		},
	}
)

var grafanaVariablePattern = regexp.MustCompile(`\$\{[a-zA-Z_][a-zA-Z0-9_]*\}`)

func hasGrafanaVariables(url string) bool {
	return grafanaVariablePattern.MatchString(url)
}

func convertGrafanaLinksToPerses(grafanaLinks []GrafanaLink) []dashboard.Link {
	if len(grafanaLinks) == 0 {
		return nil
	}

	persesLinks := make([]dashboard.Link, len(grafanaLinks))
	for i, grafanaLink := range grafanaLinks {
		persesLinks[i] = dashboard.Link{
			Name:            grafanaLink.Title,
			URL:             grafanaLink.URL,
			TargetBlank:     grafanaLink.TargetBlank,
			RenderVariables: hasGrafanaVariables(grafanaLink.URL),
		}
	}
	return persesLinks
}

func (m *completeMigration) migratePanels(grafanaDashboard *SimplifiedDashboard, useDefaultDatasource bool) (map[string]*dashboard.Panel, error) {
	panels := make(map[string]*dashboard.Panel)
	for i, p := range grafanaDashboard.Panels {
		if p.Type == grafanaPanelRowType {
			for j, innerPanel := range p.Panels {
				panel, err := m.migratePanel(innerPanel, useDefaultDatasource)
				if err != nil {
					return nil, err
				}
				panels[fmt.Sprintf("%d_%d", i, j)] = panel
			}
		} else {
			panel, err := m.migratePanel(p, useDefaultDatasource)
			if err != nil {
				return nil, err
			}
			panels[fmt.Sprintf("%d", i)] = panel
		}
	}
	return panels, nil
}

func (m *completeMigration) migratePanel(grafanaPanel Panel, useDefaultDatasource bool) (*dashboard.Panel, error) {
	result := &dashboard.Panel{
		Kind: string(plugin.KindPanel),
		Spec: dashboard.PanelSpec{
			Display: &dashboard.PanelDisplay{
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
	panelPlugin, panelMigrationIsEmpty, err := ExecutePanelScript(migrateScriptInstance.instance, grafanaPanel.RawMessage)
	if err != nil {
		return nil, fmt.Errorf("error migrating %s panel %q: %w", grafanaPanel.Type, grafanaPanel.Title, err)
	}
	if panelMigrationIsEmpty {
		result.Spec.Plugin = defaultPanelPlugin
	} else {
		result.Spec.Plugin = *panelPlugin
	}
	m.migrateQueries(grafanaPanel.Targets, result)
	result.Spec.Links = convertGrafanaLinksToPerses(grafanaPanel.Links)

	// Apply datasource cleaning if the flag is set
	if useDefaultDatasource {
		// Clean datasource references on all queries in this panel
		for _, query := range result.Spec.Queries {
			if pluginSpec, ok := query.Spec.Plugin.Spec.(map[string]any); ok {
				if datasourceRef, ok := pluginSpec["datasource"].(map[string]any); ok {
					// Remove explicit datasource references to use default datasource
					delete(datasourceRef, "name")
				}
			}
		}
	}

	return result, nil
}

func (m *completeMigration) migrateQueries(targets []json.RawMessage, result *dashboard.Panel) {
	// As Grafana does not provide a type of their queries, we can only execute every query migration script hoping there is only one that matches the target.
	for _, target := range targets {
		// We try first to execute the migration script from the dev migration instance.
		isQueryMigrationEmpty := migrateQuery(m.devMig.queries, target, result)
		if isQueryMigrationEmpty {
			// If the migration failed, we tried again with the prod migration instance.
			isQueryMigrationEmpty = migrateQuery(m.mig.queries, target, result)
			if isQueryMigrationEmpty {
				result.Spec.Queries = append(result.Spec.Queries, dashboard.Query{
					Kind: string(plugin.KindTimeSeriesQuery),
					Spec: dashboard.QuerySpec{
						Plugin: defaultQueryPlugin,
					},
				})
			}
		}
	}
}

type matchedQuery struct {
	query  *queryInstance
	plugin *plugin.Plugin
	kind   string
}

func sprintKinds(mq []matchedQuery) string {
	kinds := []string{}
	for _, query := range mq {
		kinds = append(kinds, query.kind)
	}
	return strings.Join(kinds, ", ")
}

// executeQueryScript is a package-level variable so tests can stub it without real CUE files.
var executeQueryScript = ExecuteQueryScript

func migrateQuery(queries map[string]*queryInstance, target json.RawMessage, result *dashboard.Panel) bool {
	var matchedQueries []matchedQuery
	// As we cannot have a direct matching between the Grafana model and the query plugin,
	// we can only execute every query migration script hoping at most one will work.
	// The issue is that some Grafana queries are not specific enough to be matched with a single query plugin,
	// so we can have multiple query migration scripts that match the same Grafana query.
	for queryKind, query := range queries {
		plg, isEmpty, err := executeQueryScript(query.instance, target)
		if err != nil {
			logrus.WithError(err).Debug("failed to execute query migration script")
			continue
		}
		if isEmpty {
			continue
		}
		matchedQueries = append(matchedQueries, matchedQuery{query, plg, queryKind})
	}
	if len(matchedQueries) > 1 {
		if logrus.IsLevelEnabled(logrus.DebugLevel) {
			logrus.Debugf("ambiguous query migration: %d (%s) plugins matched the same target; target JSON: %s", len(matchedQueries), sprintKinds(matchedQueries), target)
		} else {
			logrus.Warnf("ambiguous query migration: %d plugins matched the same target: %s", len(matchedQueries), sprintKinds(matchedQueries))
		}
		return true
	}
	if len(matchedQueries) == 0 {
		if logrus.IsLevelEnabled(logrus.DebugLevel) {
			logrus.Debugf("failed query migration: no plugins found matching target; target JSON: %s", target)
		} else {
			logrus.Warn("failed query migration: no plugins found matching target")
		}
		return true
	}
	result.Spec.Queries = append(result.Spec.Queries, dashboard.Query{
		Kind: string(matchedQueries[0].query.kind),
		Spec: dashboard.QuerySpec{
			Plugin: *matchedQueries[0].plugin,
		},
	})

	return false
}

func ExecuteQueryScript(cueScript *build.Instance, grafanaQueryData []byte) (*plugin.Plugin, bool, error) {
	return executeCuelangScript(cueScript, grafanaQueryData, "#target", "query")
}

func ExecutePanelScript(cueScript *build.Instance, grafanaPanelData []byte) (*plugin.Plugin, bool, error) {
	return executeCuelangScript(cueScript, grafanaPanelData, "#panel", "panel")
}
