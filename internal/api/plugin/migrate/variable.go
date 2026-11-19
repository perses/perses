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

	"cuelang.org/go/cue/build"
	"github.com/perses/perses/internal/api/plugin/migrate/grafana"
	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/dashboard/variable"
	"github.com/perses/spec/go/plugin"
	"github.com/sirupsen/logrus"
)

var mappingSort = []variable.Sort{
	variable.SortNone,
	variable.SortAlphabeticalAsc,
	variable.SortAlphabeticalDesc,
	variable.SortNumericalAsc,
	variable.SortNumericalDesc,
	variable.SortAlphabeticalCaseInsensitiveAsc,
	variable.SortAlphabeticalCaseInsensitiveDesc,
}

var defaultVariablePlugin = plugin.Plugin{
	Kind: "StaticListVariable",
	Spec: &struct {
		Values []string `json:"values"`
	}{
		Values: []string{"grafana", "migration", "not", "supported"},
	},
}

// grafanaHideVariable is the value of the field `hide` of a Grafana variable that hides it. The other values show it:
// with its label (0), without its label (1), or in the controls menu of the dashboard (3).
const grafanaHideVariable = 2

// isVariableHidden tells whether the Grafana variable is hidden in the dashboard.
func isVariableHidden(v grafana.TemplateVar) bool {
	return v.Hide == grafanaHideVariable
}

func buildDefaultVariable(v grafana.TemplateVar) dashboard.Variable {
	return dashboard.Variable{
		Kind: variable.KindList,
		Spec: &dashboard.ListVariableSpec{
			ListSpec: variable.ListSpec{
				Plugin: defaultVariablePlugin,
				Display: &variable.Display{
					Name:        v.Label,
					Description: v.Description,
					Hidden:      isVariableHidden(v),
				},
				AllowAllValue:  v.IncludeAll,
				AllowMultiple:  v.Multi,
				CustomAllValue: v.AllValue,
				DefaultValue:   v.DefaultValue(),
				Sort:           grafanaMappingSort(v.Sort),
			},
			Name: v.Name,
		},
	}
}

func grafanaMappingSort(sort *int) *variable.Sort {
	if sort == nil {
		return nil
	}
	i := *sort
	if i >= len(mappingSort) || i < 0 {
		return nil
	}
	return &mappingSort[i]
}

func (m *completeMigration) migrateVariables(grafanaDashboard *grafana.Dashboard) []dashboard.Variable {
	var result []dashboard.Variable
	for _, v := range grafanaDashboard.Templating.List {
		if v.Type == "constant" || v.Type == "textbox" {
			persesStaticVariable := migrateTextVariable(v)
			if persesStaticVariable == nil {
				result = append(result, buildDefaultVariable(v))
			} else {
				result = append(result, *persesStaticVariable)
			}
		} else {
			result = append(result, m.migrateListVariable(v))
		}
	}
	return result
}

func (m *completeMigration) migrateListVariable(v grafana.TemplateVar) dashboard.Variable {
	result := dashboard.Variable{
		Kind: variable.KindList,
	}
	spec := &dashboard.ListVariableSpec{
		ListSpec: variable.ListSpec{
			Display: &variable.Display{
				Name:        v.Label,
				Description: v.Description,
				Hidden:      isVariableHidden(v),
			},
			AllowAllValue: v.IncludeAll,
			AllowMultiple: v.Multi,
			DefaultValue:  v.DefaultValue(),
			Sort:          grafanaMappingSort(v.Sort),
		},
		Name: v.Name,
	}

	// Only set CustomAllValue if IncludeAll is enabled for the variable.
	if v.IncludeAll {
		spec.CustomAllValue = v.AllValue
	}

	isQueryMigrationEmpty := migrateListVar(m.devMig.variables, v, spec)
	if isQueryMigrationEmpty {
		isQueryMigrationEmpty = migrateListVar(m.mig.variables, v, spec)
		if isQueryMigrationEmpty {
			spec.Plugin = defaultVariablePlugin
		}
	}
	result.Spec = spec
	return result
}

func migrateListVar(varInstances map[string]*build.Instance, v grafana.TemplateVar, specResult *dashboard.ListVariableSpec) bool {
	isQueryMigrationEmpty := true
	// Dynamic variables are usually in a parameter named 'query' in the Grafana data model.
	// Then depending on what contains the query, it will change the type of the plugin.
	// So there is no easy way to know in advance which migration script to use.
	// A simple way to handle this is to execute all the migration scripts and keep the first one that returns a non-empty plugin.
	for _, variableInstance := range varInstances {
		plugin, variableMigrationIsEmpty, err := ExecuteVariableScript(variableInstance, v.RawMessage)
		if err != nil {
			logrus.WithError(err).Debug("failed to execute variable migration script")
			continue
		}
		if !variableMigrationIsEmpty {
			specResult.Plugin = *plugin
			isQueryMigrationEmpty = false
			break
		}
	}
	return isQueryMigrationEmpty
}

func migrateTextVariable(v grafana.TemplateVar) *dashboard.Variable {
	var value string
	if len(v.Query) > 0 {
		data, err := v.Query.MarshalJSON()
		if err != nil {
			logrus.WithError(err).Errorf("failed to marshal template variable %q query", v.Name)
			return nil
		}
		_ = json.Unmarshal(data, &value)
	}

	return &dashboard.Variable{
		Kind: variable.KindText,
		Spec: &dashboard.TextVariableSpec{
			TextSpec: variable.TextSpec{
				Display: &variable.Display{
					Name:        v.Label,
					Description: v.Description,
					Hidden:      isVariableHidden(v),
				},
				Constant: v.Type == "constant",
				Value:    value,
			},
			Name: v.Name,
		},
	}
}

func ExecuteVariableScript(cueScript *build.Instance, grafanaVariableData []byte) (*plugin.Plugin, bool, error) {
	return executeCuelangScript(cueScript, grafanaVariableData, varDefID, "variable")
}
