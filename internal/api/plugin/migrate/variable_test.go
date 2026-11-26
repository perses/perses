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
	"fmt"
	"testing"

	"github.com/perses/perses/internal/api/plugin/migrate/grafana"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/dashboard/variable"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrateVariableVisibility(t *testing.T) {
	tests := []struct {
		title    string
		hide     string
		expected bool
	}{
		{title: "no hide field shows the variable", hide: "", expected: false},
		{title: "hide 0 shows the variable with its label", hide: `"hide": 0,`, expected: false},
		{title: "hide 1 shows the variable without its label", hide: `"hide": 1,`, expected: false},
		{title: "hide 2 hides the variable", hide: `"hide": 2,`, expected: true},
		{title: "hide 3 shows the variable in the controls menu", hide: `"hide": 3,`, expected: false},
	}
	// The list variables (any type but textbox and constant) and the text variables are migrated separately.
	for _, variableType := range []string{"query", "custom", "textbox", "constant"} {
		for _, test := range tests {
			t.Run(fmt.Sprintf("%s: %s", variableType, test.title), func(t *testing.T) {
				var v grafana.TemplateVar
				data := fmt.Sprintf(`{%s "name": "my_var", "type": %q, "query": "value"}`, test.hide, variableType)
				require.NoError(t, json.Unmarshal([]byte(data), &v))
				grafanaDashboard := &grafana.Dashboard{}
				grafanaDashboard.Templating.List = []grafana.TemplateVar{v}

				m := &completeMigration{mig: &mig{}, devMig: &mig{}}
				variables := m.migrateVariables(grafanaDashboard)
				require.Len(t, variables, 1)

				var display *variable.Display
				switch spec := variables[0].Spec.(type) {
				case *dashboard.ListVariableSpec:
					display = spec.Display
				case *dashboard.TextVariableSpec:
					display = spec.Display
				default:
					t.Fatalf("unexpected variable spec %T", spec)
				}
				require.NotNil(t, display)
				assert.Equal(t, test.expected, display.Hidden)
			})
		}
	}
}
