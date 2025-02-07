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

	"github.com/perses/perses/pkg/model/api/v1/variable"
)

const (
	grafanaPanelRowType = "row"
)

type GridPosition struct {
	Height int `json:"h"`
	Width  int `json:"w"`
	X      int `json:"x"`
	Y      int `json:"y"`
}

type Panel struct {
	Type         string            `json:"type"`
	Title        string            `json:"title"`
	Description  string            `json:"description"`
	Collapsed    bool              `json:"collapsed"`
	Panels       []Panel           `json:"panels"`
	GridPosition GridPosition      `json:"gridPos"`
	Targets      []json.RawMessage `json:"targets"`
	json.RawMessage
}

func (p *Panel) UnmarshalJSON(data []byte) error {
	var tmp map[string]json.RawMessage
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	panel := Panel{}
	if t, ok := tmp["type"]; ok {
		_ = json.Unmarshal(t, &panel.Type)
	}
	if title, ok := tmp["title"]; ok {
		_ = json.Unmarshal(title, &panel.Title)
	}
	if desc, ok := tmp["description"]; ok {
		_ = json.Unmarshal(desc, &panel.Description)
	}
	if collapsed, ok := tmp["collapsed"]; ok {
		_ = json.Unmarshal(collapsed, &panel.Collapsed)
	}
	if innerPanels, ok := tmp["panels"]; ok {
		if err := json.Unmarshal(innerPanels, &panel.Panels); err != nil {
			return err
		}
		delete(tmp, "panels")
	}
	if grid, ok := tmp["gridPos"]; ok {
		if err := json.Unmarshal(grid, &panel.GridPosition); err != nil {
			return err
		}
		delete(tmp, "gridPos")
	}
	if targets, ok := tmp["targets"]; ok {
		if err := json.Unmarshal(targets, &panel.Targets); err != nil {
			return err
		}
		delete(tmp, "targets")
	}
	var err error
	panel.RawMessage, err = json.Marshal(tmp)
	if err != nil {
		return err
	}
	*p = panel
	return nil
}

type CurrentValue struct {
	Value *variable.DefaultValue `json:"value,omitempty"`
}

type TemplateVar struct {
	Name        string          `json:"name"`
	Type        string          `json:"type"`
	Description string          `json:"description"`
	Label       string          `json:"label"`
	Hide        int             `json:"hide"`
	Sort        *int            `json:"sort,omitempty"`
	IncludeAll  bool            `json:"includeAll"`
	AllValue    string          `json:"allValue"`
	Multi       bool            `json:"multi"`
	Current     *CurrentValue   `json:"current,omitempty"`
	Query       json.RawMessage `json:"query"`
	json.RawMessage
}

func (v *TemplateVar) UnmarshalJSON(data []byte) error {
	var tmp map[string]json.RawMessage
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	grafanaVariable := TemplateVar{}
	if name, ok := tmp["name"]; ok {
		_ = json.Unmarshal(name, &grafanaVariable.Name)
	}
	if t, ok := tmp["type"]; ok {
		_ = json.Unmarshal(t, &grafanaVariable.Type)
	}
	if description, ok := tmp["description"]; ok {
		_ = json.Unmarshal(description, &grafanaVariable.Description)
	}
	if label, ok := tmp["label"]; ok {
		_ = json.Unmarshal(label, &grafanaVariable.Label)
	}
	if hide, ok := tmp["hide"]; ok {
		_ = json.Unmarshal(hide, &grafanaVariable.Hide)
	}
	if sort, ok := tmp["sort"]; ok {
		_ = json.Unmarshal(sort, &grafanaVariable.Sort)
	}
	if includeAll, ok := tmp["includeAll"]; ok {
		_ = json.Unmarshal(includeAll, &grafanaVariable.IncludeAll)
	}
	if allValue, ok := tmp["allValue"]; ok {
		_ = json.Unmarshal(allValue, &grafanaVariable.AllValue)
	}
	if multi, ok := tmp["multi"]; ok {
		_ = json.Unmarshal(multi, &grafanaVariable.Multi)
	}
	if current, ok := tmp["current"]; ok {
		if err := json.Unmarshal(current, &grafanaVariable.Current); err != nil {
			return err
		}
		delete(tmp, "current")
	}
	if query, ok := tmp["query"]; ok {
		if err := json.Unmarshal(query, &grafanaVariable.Query); err != nil {
			return err
		}
	}
	var err error
	grafanaVariable.RawMessage, err = json.Marshal(tmp)
	if err != nil {
		return err
	}
	*v = grafanaVariable
	return nil
}

func (v *TemplateVar) getDefaultValue() *variable.DefaultValue {
	if v.Current == nil {
		return nil
	}
	return v.Current.Value
}

type SimplifiedDashboard struct {
	UID        string  `json:"uid,omitempty"`
	Title      string  `json:"title"`
	Panels     []Panel `json:"panels"`
	Templating struct {
		List []TemplateVar `json:"list"`
	} `json:"templating"`
}

func (d *SimplifiedDashboard) UnmarshalJSON(data []byte) error {
	tmp := &SimplifiedDashboard{}
	type plain SimplifiedDashboard
	if err := json.Unmarshal(data, (*plain)(tmp)); err != nil {
		return err
	}
	tmp.rearrangeGrafanaPanelsWithinExpandedRows()
	*d = *tmp
	return nil
}

// This function addresses an issue we have with Grafana datamodel when it comes to migrating dashboards to Perses: When
// a row is expanded in Grafana, its children panels are moved up in the main panels list, thus become siblings of the row.
// When it comes to Perses migration, we need to recompose the parent->children relationships.
// However, in its current state, the CUE language doesn't permit us to achieve this recomposition, hence this processing in the backend code.
//
// So what this function does is basically the following: whenever such pattern is encountered in the panel list:
// ...
// row1,
// panelA,
// panelB,
// panelC,
// row2,
// ...
// the objects gets rearranged like:
// ...
//
//	row1: {
//	  panelA,
//	  panelB,
//	  panelC,
//	},
//
// row2,
// ...
func (d *SimplifiedDashboard) rearrangeGrafanaPanelsWithinExpandedRows() {
	var newPanelList []Panel
	var parentRow *Panel
	for _, panel := range d.Panels {
		if panel.Type == grafanaPanelRowType {
			if parentRow != nil {
				// situation corresponding to this case:
				// row1,   <- current parentRow
				// panelA,
				// panelB,
				// panelC,
				// row2,   <- current iterated panel
				// ...
				// -> in this case, we should stop appending panels to the previously-registered parentRow,
				// because we encountered a new row (we don't care if it is expanded or collapsed), thus we
				// append parentRow to our new panel list.
				// We also reset its value afterward.
				// (parentRow will eventually be set to the newly encountered row if it matches the expanded condition below)
				newPanelList = append(newPanelList, *parentRow)
				parentRow = nil
			}
			if panel.Collapsed {
				// any collapsed row should be appended as-is to our new panel list, without modifications.
				newPanelList = append(newPanelList, panel)
			} else {
				// In this case, we save the newly encountered expanded row for the next iteration(s) as it is expanded.
				// We'll eventually have to append the next panel within it.
				parentRow = &panel
			}
		} else {
			if parentRow != nil {
				// situation corresponding to this case:
				// row1,   <- current parentRow
				// panelA,
				// panelB, <- current iterated panel
				// ...
				// -> in this case we have to move this non-row panel inside the saved parentRow
				// add empty panels array to row if missing
				parentRow.Panels = append(parentRow.Panels, panel)
			} else {
				// Situation corresponding to this case:
				// panelA,
				// panelB, <- current iterated panel
				// row1,
				// ...
				// -> in this case, we append the panel as-is.
				// Technically, this case applies only when there are panels placed before any row
				newPanelList = append(newPanelList, panel)
			}
		}
	}
	// once the loop is over, it's possible that the last row we iterated over was expanded, but the loop finished,
	// thus we need to append it here
	if parentRow != nil {
		newPanelList = append(newPanelList, *parentRow)
	}
	d.Panels = newPanelList
}
