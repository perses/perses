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
	"encoding/json"

	"cuelang.org/go/cue/build"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
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

func grafanaMappingSort(sort *int) *variable.Sort {
	if sort == nil {
		return nil
	}
	i := *sort
	if i >= len(mappingSort) {
		return nil
	}
	return &mappingSort[i]
}

func (m *mig) migrateVariables(grafanaDashboard *SimplifiedDashboard) ([]dashboard.Variable, error) {
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
	return result, nil
}

func (m *mig) migrateListVariable(v TemplateVar) dashboard.Variable {
	result := dashboard.Variable{
		Kind: variable.KindList,
	}
	spec := &dashboard.ListVariableSpec{
		ListSpec: variable.ListSpec{
			Display: &variable.Display{
				Name:        v.Label,
				Description: v.Description,
				Hidden:      v.Hide > 0,
			},
			AllowAllValue:  v.IncludeAll,
			AllowMultiple:  v.Multi,
			CustomAllValue: v.AllValue,
			DefaultValue:   v.getDefaultValue(),
			Sort:           grafanaMappingSort(v.Sort),
		},
		Name: v.Name,
	}

	i := 0
	for ; i < len(m.variables); i++ {
		plugin, variableMigrationIsEmpty, err := executeVariableMigrationScript(m.variables[i], v.RawMessage)
		if err != nil {
			logrus.WithError(err).Debug("failed to execute variable migration script")
			continue
		}
		if !variableMigrationIsEmpty {
			spec.ListSpec.Plugin = *plugin
			break
		}
	}
	if i == len(m.variables) {
		return buildDefaultVariable(v)
	}
	result.Spec = spec
	return result
}

func migrateTextVariable(v TemplateVar) *dashboard.Variable {
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
					Hidden:      v.Hide > 0,
				},
				Constant: v.Type == "constant",
				Value:    value,
			},
			Name: v.Name,
		},
	}
}

func executeVariableMigrationScript(cueScript *build.Instance, grafanaVariableData []byte) (*common.Plugin, bool, error) {
	return executeCuelangMigrationScript(cueScript, grafanaVariableData, "#var", "variable")
}
