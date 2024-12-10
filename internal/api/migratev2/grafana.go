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

import "encoding/json"

type GrisPosition struct {
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
	GridPosition GrisPosition      `json:"gridPos"`
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

type TemplateVar struct {
	Name        string          `json:"name"`
	Type        string          `json:"type"`
	Description string          `json:"description"`
	Label       string          `json:"label"`
	Hide        int             `json:"hide"`
	IncludeAll  bool            `json:"includeAll"`
	Multi       bool            `json:"multi"`
	Query       json.RawMessage `json:"query"`
	json.RawMessage
}

func (v *TemplateVar) UnmarshalJSON(data []byte) error {
	var tmp map[string]json.RawMessage
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	variable := TemplateVar{}
	if name, ok := tmp["name"]; ok {
		_ = json.Unmarshal(name, &variable.Name)
	}
	if t, ok := tmp["type"]; ok {
		_ = json.Unmarshal(t, &variable.Type)
	}
	if description, ok := tmp["description"]; ok {
		_ = json.Unmarshal(description, &variable.Description)
	}
	if label, ok := tmp["label"]; ok {
		_ = json.Unmarshal(label, &variable.Label)
	}
	if hide, ok := tmp["hide"]; ok {
		_ = json.Unmarshal(hide, &variable.Hide)
	}
	if includeAll, ok := tmp["includeAll"]; ok {
		_ = json.Unmarshal(includeAll, &variable.IncludeAll)
	}
	if multi, ok := tmp["multi"]; ok {
		_ = json.Unmarshal(multi, &variable.Multi)
	}
	if query, ok := tmp["query"]; ok {
		if err := json.Unmarshal(query, &variable.Query); err != nil {
			return err
		}
		delete(tmp, "query")
	}
	var err error
	variable.RawMessage, err = json.Marshal(tmp)
	if err != nil {
		return err
	}
	*v = variable
	return nil
}

type SimplifiedDashboard struct {
	UID        string  `json:"uid,omitempty"`
	Title      string  `json:"title"`
	Panels     []Panel `json:"panels"`
	Templating struct {
		List []TemplateVar `json:"list"`
	} `json:"templating"`
}
