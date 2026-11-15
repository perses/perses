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
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// grafanaV2Resource returns a Grafana v2 dashboard resource with the given spec.
func grafanaV2Resource(spec string) []byte {
	return []byte(fmt.Sprintf(`{"apiVersion": "dashboard.grafana.app/v2", "kind": "Dashboard", "metadata": {"name": "test"}, "spec": %s}`, spec))
}

// grafanaV2Elements returns the elements of a Grafana v2 dashboard: a timeseries panel titled with its name for each
// of the given names.
func grafanaV2Elements(names ...string) string {
	elements := make([]string, 0, len(names))
	for _, name := range names {
		elements = append(elements, fmt.Sprintf(`%q: {"kind": "Panel", "spec": {"id": 1, "title": %q, "links": [],
  "data": {"kind": "QueryGroup", "spec": {"queries": [], "transformations": [], "queryOptions": {}}},
  "vizConfig": {"kind": "VizConfig", "group": "timeseries", "version": "", "spec": {"options": {}, "fieldConfig": {"defaults": {}, "overrides": []}}}}}`, name, name))
	}
	return "{" + strings.Join(elements, ",") + "}"
}

func grafanaV2GridItem(name string, x, y, width, height int) string {
	return fmt.Sprintf(`{"kind": "GridLayoutItem", "spec": {"x": %d, "y": %d, "width": %d, "height": %d, "element": {"kind": "ElementReference", "name": %q}}}`, x, y, width, height, name)
}

// classicTestPanel holds the fields of a panel of the classic JSON model that define the layout of the dashboard.
type classicTestPanel struct {
	Type            string             `json:"type"`
	Title           string             `json:"title"`
	Collapsed       bool               `json:"collapsed"`
	GridPosition    GridPosition       `json:"gridPos"`
	Repeat          string             `json:"repeat"`
	RepeatDirection string             `json:"repeatDirection"`
	MaxPerRow       *int               `json:"maxPerRow"`
	Panels          []classicTestPanel `json:"panels"`
}

func convertGrafanaV2Layout(t *testing.T, spec string) []classicTestPanel {
	t.Helper()
	data, err := convertGrafanaResource(grafanaV2Resource(spec))
	require.NoError(t, err)
	var dashboard struct {
		Panels []classicTestPanel `json:"panels"`
	}
	require.NoError(t, json.Unmarshal(data, &dashboard))
	return dashboard.Panels
}

func TestConvertGrafanaV2RowsLayout(t *testing.T) {
	spec := `{
  "title": "Rows",
  "elements": ` + grafanaV2Elements("p1", "p2", "p3", "p4", "p5") + `,
  "layout": {"kind": "RowsLayout", "spec": {"rows": [
    {"kind": "RowsLayoutRow", "spec": {"title": "Expanded", "collapse": false, "repeat": {"mode": "variable", "value": "region"},
      "layout": {"kind": "GridLayout", "spec": {"items": [
        {"kind": "GridLayoutItem", "spec": {"x": 0, "y": 0, "width": 12, "height": 8, "element": {"kind": "ElementReference", "name": "p1"},
          "repeat": {"mode": "variable", "value": "instance", "direction": "v", "maxPerRow": 2}}},
        ` + grafanaV2GridItem("p2", 12, 0, 12, 4) + `
      ]}}}},
    {"kind": "RowsLayoutRow", "spec": {"title": "Collapsed", "collapse": true,
      "layout": {"kind": "GridLayout", "spec": {"items": [` + grafanaV2GridItem("p3", 0, 0, 24, 5) + `]}}}},
    {"kind": "RowsLayoutRow", "spec": {"hideHeader": true,
      "layout": {"kind": "GridLayout", "spec": {"items": [` + grafanaV2GridItem("p4", 0, 2, 6, 3) + `]}}}},
    {"kind": "RowsLayoutRow", "spec": {"title": "Empty", "collapse": true, "layout": {"kind": "GridLayout", "spec": {"items": []}}}},
    {"kind": "RowsLayoutRow", "spec": {"title": "Parent", "collapse": true,
      "layout": {"kind": "RowsLayout", "spec": {"rows": [
        {"kind": "RowsLayoutRow", "spec": {"title": "Child", "collapse": false,
          "layout": {"kind": "GridLayout", "spec": {"items": [` + grafanaV2GridItem("p5", 0, 0, 24, 4) + `]}}}}
      ]}}}}
  ]}}
}`
	expected := []classicTestPanel{
		{Type: "row", Title: "Expanded", GridPosition: GridPosition{X: 0, Y: 0, Width: 24, Height: 1}, Repeat: "region", Panels: []classicTestPanel{}},
		{Type: "timeseries", Title: "p1", GridPosition: GridPosition{X: 0, Y: 1, Width: 12, Height: 8}, Repeat: "instance", RepeatDirection: "v", MaxPerRow: new(2)},
		{Type: "timeseries", Title: "p2", GridPosition: GridPosition{X: 12, Y: 1, Width: 12, Height: 4}},
		{Type: "row", Title: "Collapsed", Collapsed: true, GridPosition: GridPosition{X: 0, Y: 9, Width: 24, Height: 1}, Panels: []classicTestPanel{
			{Type: "timeseries", Title: "p3", GridPosition: GridPosition{X: 0, Y: 10, Width: 24, Height: 5}},
		}},
		{Type: "timeseries", Title: "p4", GridPosition: GridPosition{X: 0, Y: 12, Width: 6, Height: 3}},
		{Type: "row", Title: "Empty", Collapsed: true, GridPosition: GridPosition{X: 0, Y: 15, Width: 24, Height: 1}, Panels: []classicTestPanel{}},
		// Rows can't be nested in the classic JSON model, so the nested rows follow their parent.
		{Type: "row", Title: "Parent", Collapsed: true, GridPosition: GridPosition{X: 0, Y: 16, Width: 24, Height: 1}, Panels: []classicTestPanel{}},
		{Type: "row", Title: "Child", GridPosition: GridPosition{X: 0, Y: 17, Width: 24, Height: 1}, Panels: []classicTestPanel{}},
		{Type: "timeseries", Title: "p5", GridPosition: GridPosition{X: 0, Y: 18, Width: 24, Height: 4}},
	}
	assert.Equal(t, expected, convertGrafanaV2Layout(t, spec))
}

func TestConvertGrafanaV2TabsAndAutoGridLayouts(t *testing.T) {
	spec := `{
  "title": "Tabs",
  "elements": ` + grafanaV2Elements("p1", "p2", "p3", "p4") + `,
  "layout": {"kind": "TabsLayout", "spec": {"tabs": [
    {"kind": "TabsLayoutTab", "spec": {"title": "Tab 1",
      "layout": {"kind": "AutoGridLayout", "spec": {"maxColumnCount": 2, "columnWidthMode": "standard", "rowHeightMode": "custom", "rowHeight": 300, "items": [
        {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p1"}, "repeat": {"mode": "variable", "value": "pod"}}},
        {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p2"}}},
        {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p3"}}}
      ]}}}},
    {"kind": "TabsLayoutTab", "spec": {"title": "Tab 2",
      "layout": {"kind": "RowsLayout", "spec": {"rows": [
        {"kind": "RowsLayoutRow", "spec": {"title": "Nested", "collapse": true,
          "layout": {"kind": "GridLayout", "spec": {"items": [` + grafanaV2GridItem("p4", 0, 0, 24, 6) + `]}}}}
      ]}}}}
  ]}}
}`
	// A custom height of 300px takes 8 lines of the grid.
	expected := []classicTestPanel{
		{Type: "row", Title: "Tab 1", GridPosition: GridPosition{X: 0, Y: 0, Width: 24, Height: 1}, Panels: []classicTestPanel{}},
		{Type: "timeseries", Title: "p1", GridPosition: GridPosition{X: 0, Y: 1, Width: 12, Height: 8}, Repeat: "pod", RepeatDirection: "h", MaxPerRow: new(2)},
		{Type: "timeseries", Title: "p2", GridPosition: GridPosition{X: 12, Y: 1, Width: 12, Height: 8}},
		{Type: "timeseries", Title: "p3", GridPosition: GridPosition{X: 0, Y: 9, Width: 12, Height: 8}},
		{Type: "row", Title: "Tab 2", GridPosition: GridPosition{X: 0, Y: 17, Width: 24, Height: 1}, Panels: []classicTestPanel{}},
		{Type: "row", Title: "Nested", Collapsed: true, GridPosition: GridPosition{X: 0, Y: 18, Width: 24, Height: 1}, Panels: []classicTestPanel{
			{Type: "timeseries", Title: "p4", GridPosition: GridPosition{X: 0, Y: 19, Width: 24, Height: 6}},
		}},
	}
	assert.Equal(t, expected, convertGrafanaV2Layout(t, spec))
}

func TestConvertGrafanaV2AutoGridLayoutDefaults(t *testing.T) {
	spec := `{
  "title": "Auto grid",
  "elements": ` + grafanaV2Elements("p1", "p2", "p3", "p4") + `,
  "layout": {"kind": "AutoGridLayout", "spec": {"columnWidthMode": "standard", "rowHeightMode": "tall", "items": [
    {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p1"}}},
    {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p2"}}},
    {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p3"}}},
    {"kind": "AutoGridLayoutItem", "spec": {"element": {"kind": "ElementReference", "name": "p4"}}}
  ]}}
}`
	expected := []classicTestPanel{
		{Type: "timeseries", Title: "p1", GridPosition: GridPosition{X: 0, Y: 0, Width: 8, Height: 14}},
		{Type: "timeseries", Title: "p2", GridPosition: GridPosition{X: 8, Y: 0, Width: 8, Height: 14}},
		{Type: "timeseries", Title: "p3", GridPosition: GridPosition{X: 16, Y: 0, Width: 8, Height: 14}},
		{Type: "timeseries", Title: "p4", GridPosition: GridPosition{X: 0, Y: 14, Width: 8, Height: 14}},
	}
	assert.Equal(t, expected, convertGrafanaV2Layout(t, spec))
}

func TestConvertGrafanaV2Dashboard(t *testing.T) {
	spec := `{
  "title": "Panels",
  "description": "Some panels",
  "tags": ["team-a"],
  "links": [{"title": "Docs", "type": "link", "icon": "doc", "tooltip": "", "url": "https://example.com", "tags": [], "asDropdown": false, "targetBlank": true, "includeVars": false, "keepTime": false}],
  "timeSettings": {"timezone": "utc", "from": "now-12h", "to": "now", "autoRefresh": "30s", "autoRefreshIntervals": ["30s"], "hideTimepicker": false, "fiscalYearStartMonth": 0},
  "elements": {
    "panel-7": {"kind": "Panel", "spec": {"id": 7, "title": "CPU", "description": "CPU usage", "transparent": true,
      "links": [{"title": "Runbook", "url": "https://example.com/runbook"}],
      "data": {"kind": "QueryGroup", "spec": {
        "queries": [
          {"kind": "PanelQuery", "spec": {"query": {"kind": "DataQuery", "group": "prometheus", "version": "v0", "datasource": {"name": "prom-a"}, "spec": {"expr": "up", "legendFormat": "{{job}}"}}, "refId": "A", "hidden": false}},
          {"kind": "PanelQuery", "spec": {"query": {"kind": "DataQuery", "group": "prometheus", "version": "v0", "datasource": {"name": "prom-b"}, "spec": {"expr": "down"}}, "refId": "B", "hidden": true}},
          {"kind": "PanelQuery", "spec": {"query": {"kind": "DataQuery", "group": "loki", "version": "v0", "spec": {"expr": "{job=\"x\"}"}}, "refId": "C", "hidden": false}}
        ],
        "transformations": [
          {"kind": "Transformation", "group": "organize", "spec": {"options": {"renameByName": {"a": "b"}}}},
          {"kind": "reduce", "spec": {"id": "reduce", "options": {}}},
          {"kind": "merge", "spec": {"options": {}}}
        ],
        "queryOptions": {"interval": "1m", "maxDataPoints": 500, "timeFrom": "2h"}}},
      "vizConfig": {"kind": "VizConfig", "group": "timeseries", "version": "12.1.0", "spec": {"options": {"legend": {"showLegend": true}}, "fieldConfig": {"defaults": {"unit": "percent"}, "overrides": []}}}}},
    "panel-8": {"kind": "Panel", "spec": {"id": 8, "title": "Memory", "links": [],
      "data": {"kind": "QueryGroup", "spec": {
        "queries": [{"kind": "PanelQuery", "spec": {"query": {"kind": "DataQuery", "group": "prometheus", "version": "v0", "datasource": {"name": "prom-a"}, "spec": {"expr": "memory"}}, "refId": "A", "hidden": false}}],
        "transformations": [], "queryOptions": {}}},
      "vizConfig": {"kind": "VizConfig", "group": "stat", "version": "", "spec": {"options": {}, "fieldConfig": {"defaults": {}, "overrides": []}}}}},
    "panel-3": {"kind": "LibraryPanel", "spec": {"id": 3, "title": "Shared", "libraryPanel": {"name": "Shared", "uid": "lib-1"}}}
  },
  "layout": {"kind": "GridLayout", "spec": {"items": [
    ` + grafanaV2GridItem("panel-7", 0, 0, 12, 8) + `,
    ` + grafanaV2GridItem("panel-8", 12, 0, 6, 8) + `,
    ` + grafanaV2GridItem("panel-3", 18, 0, 6, 8) + `
  ]}}
}`
	expected := `{
  "uid": "test",
  "title": "Panels",
  "description": "Some panels",
  "tags": ["team-a"],
  "links": [{"title": "Docs", "type": "link", "icon": "doc", "tooltip": "", "url": "https://example.com", "tags": [], "asDropdown": false, "targetBlank": true, "includeVars": false, "keepTime": false}],
  "time": {"from": "now-12h", "to": "now"},
  "refresh": "30s",
  "timezone": "utc",
  "templating": {"list": []},
  "annotations": {"list": []},
  "panels": [
    {
      "id": 7,
      "type": "timeseries",
      "title": "CPU",
      "description": "CPU usage",
      "transparent": true,
      "pluginVersion": "12.1.0",
      "links": [{"title": "Runbook", "url": "https://example.com/runbook"}],
      "interval": "1m",
      "maxDataPoints": 500,
      "timeFrom": "2h",
      "options": {"legend": {"showLegend": true}},
      "fieldConfig": {"defaults": {"unit": "percent"}, "overrides": []},
      "datasource": {"type": "datasource", "uid": "-- Mixed --"},
      "targets": [
        {"expr": "up", "legendFormat": "{{job}}", "refId": "A", "datasource": {"type": "prometheus", "uid": "prom-a"}},
        {"expr": "down", "refId": "B", "hide": true, "datasource": {"type": "prometheus", "uid": "prom-b"}},
        {"expr": "{job=\"x\"}", "refId": "C", "datasource": {"type": "loki"}}
      ],
      "transformations": [
        {"id": "organize", "options": {"renameByName": {"a": "b"}}},
        {"id": "reduce", "options": {}},
        {"id": "merge", "options": {}}
      ],
      "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8}
    },
    {
      "id": 8,
      "type": "stat",
      "title": "Memory",
      "links": [],
      "options": {},
      "fieldConfig": {"defaults": {}, "overrides": []},
      "datasource": {"type": "prometheus", "uid": "prom-a"},
      "targets": [{"expr": "memory", "refId": "A", "datasource": {"type": "prometheus", "uid": "prom-a"}}],
      "gridPos": {"x": 12, "y": 0, "w": 6, "h": 8}
    },
    {
      "id": 3,
      "title": "Shared",
      "libraryPanel": {"name": "Shared", "uid": "lib-1"},
      "gridPos": {"x": 18, "y": 0, "w": 6, "h": 8}
    }
  ]
}`
	data, err := convertGrafanaResource(grafanaV2Resource(spec))
	require.NoError(t, err)
	assert.JSONEq(t, expected, string(data))
}

func TestConvertGrafanaV2VariablesAndAnnotations(t *testing.T) {
	spec := `{
  "title": "Variables",
  "elements": {},
  "variables": [
    {"kind": "QueryVariable", "spec": {"name": "job", "current": {"text": "api", "value": "api"}, "label": "Job", "hide": "hideLabel", "refresh": "onTimeRangeChanged", "skipUrlSync": false,
      "query": {"kind": "DataQuery", "group": "prometheus", "version": "v0", "datasource": {"name": "prom"}, "spec": {"query": "label_values(up, job)", "qryType": 1}},
      "regex": "", "sort": "alphabeticalAsc", "options": [], "multi": true, "includeAll": true, "allValue": ".*", "allowCustomValue": true}},
    {"kind": "QueryVariable", "spec": {"name": "instance", "hide": "inControlsMenu", "refresh": "never", "sort": "naturalDesc",
      "query": {"kind": "DataQuery", "group": "prometheus", "version": "v0", "spec": {"__legacyStringValue": "label_values(instance)"}}}},
    {"kind": "DatasourceVariable", "spec": {"name": "ds", "pluginId": "prometheus", "refresh": "onDashboardLoad", "regex": "", "current": {"text": "default", "value": "default"}, "hide": "dontHide"}},
    {"kind": "SwitchVariable", "spec": {"name": "debug", "current": "true", "enabledValue": "true", "disabledValue": "false", "hide": "dontHide"}},
    {"kind": "GroupByVariable", "group": "prometheus", "datasource": {"name": "prom"}, "spec": {"name": "by", "current": {"text": "", "value": ""}, "multi": true, "hide": "dontHide"}},
    {"kind": "FancyVariable", "spec": {"name": "fancy", "hide": "unknown"}}
  ],
  "annotations": [
    {"kind": "AnnotationQuery", "spec": {"query": {"kind": "DataQuery", "group": "grafana", "version": "v0", "datasource": {"name": "-- Grafana --"}, "spec": {}},
      "enable": true, "hide": true, "iconColor": "rgba(0, 211, 255, 1)", "name": "Annotations & Alerts", "builtIn": true, "legacyOptions": {"type": "dashboard"}}},
    {"kind": "AnnotationQuery", "spec": {"query": {"kind": "DataQuery", "group": "prometheus", "version": "v0", "datasource": {"name": "prom"}, "spec": {"expr": "ALERTS", "step": "60s"}},
      "enable": false, "hide": false, "iconColor": "red", "name": "Alerts", "builtIn": false, "filter": {"exclude": false, "ids": [1]}, "legacyOptions": {"titleFormat": "{{alertname}}"}}}
  ],
  "layout": {"kind": "RowsLayout", "spec": {"rows": [
    {"kind": "RowsLayoutRow", "spec": {"title": "Section", "collapse": false, "layout": {"kind": "GridLayout", "spec": {"items": []}},
      "variables": [
        {"kind": "TextVariable", "spec": {"name": "job", "query": "already defined by the dashboard", "hide": "dontHide"}},
        {"kind": "ConstantVariable", "spec": {"name": "region", "query": "eu", "hide": "hideVariable"}}
      ],
      "annotations": [
        {"kind": "AnnotationQuery", "spec": {"query": {"kind": "DataQuery", "group": "loki", "version": "v0", "spec": {"expr": "{app=\"deploy\"}"}}, "enable": true, "hide": false, "iconColor": "blue", "name": "Deploys"}}
      ]}}
  ]}}
}`
	expectedVariables := `{"list": [
  {"type": "query", "name": "job", "current": {"text": "api", "value": "api"}, "label": "Job", "hide": 1, "refresh": 2, "skipUrlSync": false,
    "query": {"query": "label_values(up, job)", "qryType": 1}, "datasource": {"type": "prometheus", "uid": "prom"},
    "regex": "", "sort": 1, "options": [], "multi": true, "includeAll": true, "allValue": ".*", "allowCustomValue": true},
  {"type": "query", "name": "instance", "hide": 3, "refresh": 0, "sort": 8, "query": "label_values(instance)", "datasource": {"type": "prometheus"}},
  {"type": "datasource", "name": "ds", "pluginId": "prometheus", "query": "prometheus", "refresh": 1, "regex": "", "current": {"text": "default", "value": "default"}, "hide": 0},
  {"type": "switch", "name": "debug", "current": {"text": "true", "value": "true"}, "enabledValue": "true", "disabledValue": "false", "hide": 0},
  {"type": "groupby", "name": "by", "current": {"text": "", "value": ""}, "multi": true, "hide": 0, "datasource": {"type": "prometheus", "uid": "prom"}},
  {"type": "FancyVariable", "name": "fancy"},
  {"type": "constant", "name": "region", "query": "eu", "hide": 2}
]}`
	expectedAnnotations := `{"list": [
  {"datasource": {"type": "grafana", "uid": "-- Grafana --"}, "enable": true, "hide": true, "iconColor": "rgba(0, 211, 255, 1)", "name": "Annotations & Alerts", "builtIn": 1, "type": "dashboard"},
  {"expr": "ALERTS", "step": "60s", "datasource": {"type": "prometheus", "uid": "prom"}, "enable": false, "hide": false, "iconColor": "red", "name": "Alerts",
    "filter": {"exclude": false, "ids": [1]}, "titleFormat": "{{alertname}}"},
  {"expr": "{app=\"deploy\"}", "datasource": {"type": "loki"}, "enable": true, "hide": false, "iconColor": "blue", "name": "Deploys"}
]}`
	data, err := convertGrafanaResource(grafanaV2Resource(spec))
	require.NoError(t, err)
	var dashboard struct {
		Templating  json.RawMessage `json:"templating"`
		Annotations json.RawMessage `json:"annotations"`
	}
	require.NoError(t, json.Unmarshal(data, &dashboard))
	assert.JSONEq(t, expectedVariables, string(dashboard.Templating))
	assert.JSONEq(t, expectedAnnotations, string(dashboard.Annotations))
}

func TestSimplifiedDashboardUnmarshalGrafanaResource(t *testing.T) {
	tests := []struct {
		title         string
		data          string
		expectedUID   string
		expectedTitle string
		expectedTypes []string
	}{
		{
			title:         "v1beta1 resource holding the classic JSON model",
			data:          `{"apiVersion": "dashboard.grafana.app/v1beta1", "kind": "Dashboard", "metadata": {"name": "from-metadata"}, "spec": {"title": "Classic", "panels": [{"type": "timeseries", "title": "P"}]}}`,
			expectedUID:   "from-metadata",
			expectedTitle: "Classic",
			expectedTypes: []string{"timeseries"},
		},
		{
			title:         "v0alpha1 resource keeps the UID of the classic JSON model",
			data:          `{"apiVersion": "dashboard.grafana.app/v0alpha1", "kind": "Dashboard", "metadata": {"name": "from-metadata"}, "spec": {"uid": "from-spec", "title": "Classic"}}`,
			expectedUID:   "from-spec",
			expectedTitle: "Classic",
		},
		{
			title: "v2 resource with an expanded row",
			data: string(grafanaV2Resource(`{"title": "V2", "elements": ` + grafanaV2Elements("p1") + `, "layout": {"kind": "RowsLayout", "spec": {"rows": [
  {"kind": "RowsLayoutRow", "spec": {"title": "Row", "collapse": false, "layout": {"kind": "GridLayout", "spec": {"items": [` + grafanaV2GridItem("p1", 0, 0, 24, 8) + `]}}}}]}}}`)),
			expectedUID:   "test",
			expectedTitle: "V2",
			// The panels of the expanded row are nested in the row, as for a dashboard of the classic JSON model.
			expectedTypes: []string{"row"},
		},
		{
			title:         "v2beta1 resource without layout",
			data:          `{"apiVersion": "dashboard.grafana.app/v2beta1", "kind": "Dashboard", "metadata": {"name": "beta"}, "spec": {"title": "Beta", "elements": {}}}`,
			expectedUID:   "beta",
			expectedTitle: "Beta",
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			result := &SimplifiedDashboard{}
			require.NoError(t, json.Unmarshal([]byte(test.data), result))
			assert.Equal(t, test.expectedUID, result.UID)
			assert.Equal(t, test.expectedTitle, result.Title)
			var types []string
			for _, panel := range result.Panels {
				types = append(types, panel.Type)
			}
			assert.Equal(t, test.expectedTypes, types)
		})
	}
}

func TestSimplifiedDashboardUnmarshalGrafanaResourceErrors(t *testing.T) {
	tests := []struct {
		title         string
		data          string
		expectedError string
	}{
		{
			title:         "unsupported version",
			data:          `{"apiVersion": "dashboard.grafana.app/v2alpha1", "kind": "Dashboard", "metadata": {"name": "test"}, "spec": {"title": "Test"}}`,
			expectedError: `the Grafana dashboard schema "dashboard.grafana.app/v2alpha1" is not supported, please export the dashboard using the classic JSON model or the schema v2`,
		},
		{
			title:         "not a dashboard",
			data:          `{"apiVersion": "dashboard.grafana.app/v2", "kind": "LibraryPanel", "metadata": {"name": "test"}, "spec": {}}`,
			expectedError: `the Grafana resource of kind "LibraryPanel" is not a dashboard`,
		},
		{
			title:         "no spec",
			data:          `{"apiVersion": "dashboard.grafana.app/v2", "kind": "Dashboard", "metadata": {"name": "test"}}`,
			expectedError: `the Grafana dashboard "test" has no spec`,
		},
		{
			title: "missing element",
			data: string(grafanaV2Resource(`{"title": "Test", "elements": {}, "layout": {"kind": "GridLayout", "spec": {"items": [` +
				grafanaV2GridItem("panel-9", 0, 0, 24, 8) + `]}}}`)),
			expectedError: `the element "panel-9" referenced by the layout of the Grafana v2 dashboard doesn't exist`,
		},
		{
			title:         "unsupported element",
			data:          string(grafanaV2Resource(`{"title": "Test", "elements": {"w": {"kind": "Widget", "spec": {}}}, "layout": {"kind": "GridLayout", "spec": {"items": [` + grafanaV2GridItem("w", 0, 0, 24, 8) + `]}}}`)),
			expectedError: `the element "w" of the Grafana v2 dashboard has the unsupported kind "Widget"`,
		},
		{
			title: "unsupported nested layout",
			data: string(grafanaV2Resource(`{"title": "Test", "elements": {}, "layout": {"kind": "TabsLayout", "spec": {"tabs": [
  {"kind": "TabsLayoutTab", "spec": {"title": "Tab", "layout": {"kind": "MasonryLayout", "spec": {}}}}]}}}`)),
			expectedError: `the layout "MasonryLayout" of the Grafana v2 dashboard is not supported`,
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			err := json.Unmarshal([]byte(test.data), &SimplifiedDashboard{})
			assert.EqualError(t, err, test.expectedError)
		})
	}
}
