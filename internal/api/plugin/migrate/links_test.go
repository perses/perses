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
	"testing"
)

func TestPanelUnmarshalWithLinks(t *testing.T) {
	panelData := `{
		"id": 76,
		"type": "stat",
		"title": "dns",
		"description": "dns settings wrong",
		"gridPos": {
			"x": 6,
			"y": 12,
			"h": 3,
			"w": 2
		},
		"targets": [
			{
				"expr": "count(max_over_time(bios_exporter{job=\"bios/ironic\",setting_name=~\"iDrac.IPv4.DNS1\"}[90m]) == 0) OR on() vector(0)",
				"instant": true,
				"refId": "A",
				"datasource": {
					"uid": "prometheus-infra-scaleout"
				}
			}
		],
		"maxDataPoints": 100,
		"datasource": {
			"uid": "prometheus-infra-scaleout"
		},
		"links": [
			{
				"targetBlank": true,
				"title": "Prometheus",
				"url": "https://prometheus-infra-collector.example.com/graph?g0.range_input=1h"
			},
			{
				"targetBlank": true,
				"title": "Git-Blueprint",
				"url": "https://github.com/example/repo"
			}
		]
	}`

	var panel Panel
	err := json.Unmarshal([]byte(panelData), &panel)
	if err != nil {
		t.Fatalf("Failed to unmarshal panel: %v", err)
	}

	// Test basic panel properties
	if panel.Type != "stat" {
		t.Errorf("Expected panel type 'stat', got '%s'", panel.Type)
	}
	if panel.Title != "dns" {
		t.Errorf("Expected panel title 'dns', got '%s'", panel.Title)
	}

	// Test links extraction
	if len(panel.Links) != 2 {
		t.Errorf("Expected 2 links, got %d", len(panel.Links))
	}

	// Test first link
	if panel.Links[0].Title != "Prometheus" {
		t.Errorf("Expected first link title 'Prometheus', got '%s'", panel.Links[0].Title)
	}
	if panel.Links[0].URL != "https://prometheus-infra-collector.example.com/graph?g0.range_input=1h" {
		t.Errorf("Expected first link URL to match, got '%s'", panel.Links[0].URL)
	}
	if !panel.Links[0].TargetBlank {
		t.Error("Expected first link TargetBlank to be true")
	}

	// Test second link
	if panel.Links[1].Title != "Git-Blueprint" {
		t.Errorf("Expected second link title 'Git-Blueprint', got '%s'", panel.Links[1].Title)
	}
	if panel.Links[1].URL != "https://github.com/example/repo" {
		t.Errorf("Expected second link URL to match, got '%s'", panel.Links[1].URL)
	}
	if !panel.Links[1].TargetBlank {
		t.Error("Expected second link TargetBlank to be true")
	}
}

func TestConvertGrafanaLinksToPerses(t *testing.T) {
	// Test with links
	grafanaLinks := []GrafanaLink{
		{
			Title:       "Prometheus",
			URL:         "https://prometheus.example.com/graph?query=${var}",
			TargetBlank: true,
		},
		{
			Title:       "Dashboard",
			URL:         "https://grafana.example.com/d/abc123",
			TargetBlank: false,
		},
	}

	persesLinks := convertGrafanaLinksToPerses(grafanaLinks)

	if len(persesLinks) != 2 {
		t.Errorf("Expected 2 Perses links, got %d", len(persesLinks))
	}

	// Test first link conversion
	if persesLinks[0].Name != "Prometheus" {
		t.Errorf("Expected first link name 'Prometheus', got '%s'", persesLinks[0].Name)
	}
	if persesLinks[0].URL != "https://prometheus.example.com/graph?query=${var}" {
		t.Errorf("Expected first link URL to match, got '%s'", persesLinks[0].URL)
	}
	if !persesLinks[0].TargetBlank {
		t.Error("Expected first link TargetBlank to be true")
	}
	if !persesLinks[0].RenderVariables {
		t.Error("Expected first link RenderVariables to be true")
	}

	// Test second link conversion
	if persesLinks[1].Name != "Dashboard" {
		t.Errorf("Expected second link name 'Dashboard', got '%s'", persesLinks[1].Name)
	}
	if persesLinks[1].URL != "https://grafana.example.com/d/abc123" {
		t.Errorf("Expected second link URL to match, got '%s'", persesLinks[1].URL)
	}
	if persesLinks[1].TargetBlank {
		t.Error("Expected second link TargetBlank to be false")
	}
	if !persesLinks[1].RenderVariables {
		t.Error("Expected second link RenderVariables to be true")
	}

	// Test empty links
	emptyLinks := convertGrafanaLinksToPerses([]GrafanaLink{})
	if emptyLinks != nil {
		t.Error("Expected nil for empty links")
	}

	// Test nil links
	nilLinks := convertGrafanaLinksToPerses(nil)
	if nilLinks != nil {
		t.Error("Expected nil for nil links")
	}
}