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
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrateDashboardTagLink(t *testing.T) {
	got := (&completeMigration{}).migrateDashboardLinks(&SimplifiedDashboard{
		Links: []GrafanaLink{
			{Title: " Service detail ", Type: "dashboards", Tags: []string{" traffic ", "api"}, KeepTime: true, IncludeVars: true},
			{Title: "Docs", URL: "https://perses.dev", IncludeVars: true, TargetBlank: true},
			{Title: "Dropped", Type: "dashboards"},
			{Title: "No target"},
		},
	})
	require.Len(t, got, 2)
	assert.Equal(t, "Service detail", got[0].Name)
	assert.Equal(t, []string{"traffic", "api"}, got[0].Tags)
	assert.True(t, got[0].KeepTime)
	assert.True(t, got[0].IncludeVariables)
	assert.Empty(t, got[0].URL)
	assert.Equal(t, "https://perses.dev", got[1].URL)
	assert.True(t, got[1].RenderVariables)
	assert.Empty(t, got[1].Tags)
}

func TestConvertGrafanaPanelTagLink(t *testing.T) {
	got := convertGrafanaLinksToPerses([]GrafanaLink{
		{Title: "Runbook", URL: "https://example.com/${region}"},
		{Title: "Traffic", Type: "dashboards", Tags: []string{"traffic"}, KeepTime: true, IncludeVars: true},
		{URL: ""},
	})
	require.Len(t, got, 2)
	assert.True(t, got[0].RenderVariables)
	assert.Equal(t, []string{"traffic"}, got[1].Tags)
	assert.True(t, got[1].KeepTime)
	assert.True(t, got[1].IncludeVariables)
	assert.False(t, got[1].RenderVariables)
}
