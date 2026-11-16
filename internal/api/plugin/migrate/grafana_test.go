// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package migrate

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSimplifiedDashboardUnmarshal(t *testing.T) {
	tests := []struct {
		title    string
		data     string
		expected *SimplifiedDashboard
	}{
		{
			title: "Single panel",
			data: `{
    "title": "Test Dashboard",
    "panels": [
      {
        "id": 1,
        "title": "Panel 1",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(metric[5m])"
          }
        ]
      }
    ]
  }`,
			expected: &SimplifiedDashboard{
				Title: "Test Dashboard",
				Panels: []Panel{
					{
						Title: "Panel 1",
						Type:  "timeseries",
						Targets: []json.RawMessage{
							json.RawMessage(`{
            "expr": "rate(metric[5m])"
          }`),
						},
						RawMessage: json.RawMessage(`{"id":1,"targets":[{"expr":"rate(metric[5m])"}],"title":"Panel 1","type":"timeseries"}`),
					},
				},
			},
		},
		{
			title: "Time settings",
			data: `{
    "title": "Test Dashboard",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "1m",
    "timezone": "utc"
  }`,
			expected: &SimplifiedDashboard{
				Title:    "Test Dashboard",
				Time:     &GrafanaTimeRange{From: "now-6h", To: "now"},
				Refresh:  "1m",
				Timezone: "utc",
			},
		},
		{
			title:    "Auto-refresh off, as written by older Grafana versions",
			data:     `{"title": "Test Dashboard", "refresh": false}`,
			expected: &SimplifiedDashboard{Title: "Test Dashboard"},
		},
		{
			title:    "Null time settings",
			data:     `{"title": "Test Dashboard", "time": null, "refresh": null, "timezone": null}`,
			expected: &SimplifiedDashboard{Title: "Test Dashboard"},
		},
		{
			title:    "Time settings with the wrong type are ignored",
			data:     `{"title": "Test Dashboard", "time": "now-6h", "refresh": 30, "timezone": 0}`,
			expected: &SimplifiedDashboard{Title: "Test Dashboard", Time: &GrafanaTimeRange{}},
		},
		{
			title:    "Time range with a number is ignored",
			data:     `{"title": "Test Dashboard", "time": {"from": 1698228000000, "to": "now"}, "refresh": true, "timezone": false}`,
			expected: &SimplifiedDashboard{Title: "Test Dashboard", Time: &GrafanaTimeRange{}},
		},
		{
			title:    "Time settings with the wrong type don't stop the decoding of the next fields",
			data:     `{"refresh": {"a": 1}, "timezone": [], "time": [], "uid": "after", "title": "After", "tags": ["x"]}`,
			expected: &SimplifiedDashboard{UID: "after", Title: "After", Tags: []string{"x"}, Time: &GrafanaTimeRange{}},
		},
		{
			title: "Annotations",
			data: `{
    "title": "Test Dashboard",
    "annotations": {
      "list": [
        {"builtIn": 1, "enable": true, "iconColor": "rgba(0, 211, 255, 1)", "name": "Annotations & Alerts"},
        {"datasource": {"type": "prometheus", "uid": "prom"}, "enable": false, "expr": "up == 0", "name": "Down"}
      ]
    }
  }`,
			expected: &SimplifiedDashboard{
				Title: "Test Dashboard",
				Annotations: GrafanaAnnotations{
					List: []GrafanaAnnotation{
						{
							Name:       "Annotations & Alerts",
							BuiltIn:    1,
							Enable:     new(true),
							IconColor:  "rgba(0, 211, 255, 1)",
							RawMessage: json.RawMessage(`{"builtIn":1,"enable":true,"iconColor":"rgba(0, 211, 255, 1)","name":"Annotations \u0026 Alerts"}`),
						},
						{
							Name:       "Down",
							Enable:     new(false),
							RawMessage: json.RawMessage(`{"datasource":{"type":"prometheus","uid":"prom"},"enable":false,"expr":"up == 0","name":"Down"}`),
						},
					},
				},
			},
		},
		{
			title: "Annotations that are not objects are ignored, and fields with an unexpected type are left empty",
			data:  `{"title": "Test Dashboard", "annotations": {"list": ["not an annotation", {"name": 1, "enable": "yes", "expr": "up"}]}}`,
			expected: &SimplifiedDashboard{
				Title: "Test Dashboard",
				Annotations: GrafanaAnnotations{
					List: []GrafanaAnnotation{
						{RawMessage: json.RawMessage(`{"enable":"yes","expr":"up","name":1}`)},
					},
				},
			},
		},
		{
			title:    "Annotations with the wrong type don't stop the decoding of the next fields",
			data:     `{"annotations": [], "uid": "after", "title": "After"}`,
			expected: &SimplifiedDashboard{UID: "after", Title: "After"},
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			result := &SimplifiedDashboard{}
			if err := json.Unmarshal([]byte(test.data), result); err != nil {
				t.Fatalf("failed to unmarshal JSON: %s", err)
			}
			assert.Equal(t, test.expected, result)
		})
	}
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
			data: `{"apiVersion": "dashboard.grafana.app/v2", "kind": "Dashboard", "metadata": {"name": "test"}, "spec": {"title": "V2",
  "elements": {"p1": {"kind": "Panel", "spec": {"title": "p1", "vizConfig": {"group": "timeseries"}}}},
  "layout": {"kind": "RowsLayout", "spec": {"rows": [{"kind": "RowsLayoutRow", "spec": {"title": "Row", "layout": {"kind": "GridLayout", "spec": {"items": [
    {"kind": "GridLayoutItem", "spec": {"x": 0, "y": 0, "width": 24, "height": 8, "element": {"kind": "ElementReference", "name": "p1"}}}]}}}}]}}}}`,
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
			title:         "unsupported layout",
			data:          `{"apiVersion": "dashboard.grafana.app/v2", "kind": "Dashboard", "metadata": {"name": "test"}, "spec": {"title": "Test", "layout": {"kind": "MasonryLayout", "spec": {}}}}`,
			expectedError: `unable to convert the Grafana schema v2 dashboard "test": unsupported layout kind "MasonryLayout"`,
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			err := json.Unmarshal([]byte(test.data), &SimplifiedDashboard{})
			assert.EqualError(t, err, test.expectedError)
		})
	}
}
