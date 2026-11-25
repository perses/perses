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

// Package grafana holds the classic JSON model of the Grafana dashboards, and decodes into it both the dashboards
// exported with the classic JSON model and the dashboard resources of the API group dashboard.grafana.app, available
// since Grafana 12. The resources using the schema v2 are converted into the classic JSON model by the package v2.
// The migration of the decoded dashboards into Perses dashboards is done by the package migrate.
package grafana

import (
	"encoding/json"
	"fmt"
	"strings"

	v2 "github.com/perses/perses/internal/api/plugin/migrate/grafana/v2"
	"github.com/perses/spec/go/dashboard/variable"
)

const (
	// PanelRowType is the type of the panels that are rows.
	PanelRowType      = "row"
	dashboardAPIGroup = "dashboard.grafana.app/"
	dashboardKind     = "Dashboard"
)

type GridPosition struct {
	Height int     `json:"h"`
	Width  int     `json:"w"`
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
}

type Link struct {
	Title       string   `json:"title"`
	Type        string   `json:"type"`
	URL         string   `json:"url"`
	Tags        []string `json:"tags"`
	TargetBlank bool     `json:"targetBlank"`
	IncludeVars bool     `json:"includeVars"`
	KeepTime    bool     `json:"keepTime"`
	Tooltip     string   `json:"tooltip"`
}

type Panel struct {
	Type            string            `json:"type"`
	Title           string            `json:"title"`
	Description     string            `json:"description"`
	Repeat          string            `json:"repeat"`
	RepeatDirection string            `json:"repeatDirection"`
	MaxPerRow       *int              `json:"maxPerRow"`
	Collapsed       bool              `json:"collapsed"`
	Panels          []Panel           `json:"panels"`
	GridPosition    GridPosition      `json:"gridPos"`
	Targets         []json.RawMessage `json:"targets"`
	Links           []Link            `json:"links"`
	json.RawMessage
}

// Custom unmarshal to both store fields and keep raw data (used by the CUE-based migration logic).
// Checks unmarshalling errors only when unmarshaling complex structs.
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
	if repeat, ok := tmp["repeat"]; ok {
		_ = json.Unmarshal(repeat, &panel.Repeat)
	}
	if repeatDirection, ok := tmp["repeatDirection"]; ok {
		_ = json.Unmarshal(repeatDirection, &panel.RepeatDirection)
	}
	if maxPerRow, ok := tmp["maxPerRow"]; ok {
		_ = json.Unmarshal(maxPerRow, &panel.MaxPerRow)
	}
	if collapsed, ok := tmp["collapsed"]; ok {
		_ = json.Unmarshal(collapsed, &panel.Collapsed)
	}
	if innerPanels, ok := tmp["panels"]; ok {
		if err := json.Unmarshal(innerPanels, &panel.Panels); err != nil {
			return err
		}
	}
	if grid, ok := tmp["gridPos"]; ok {
		if err := json.Unmarshal(grid, &panel.GridPosition); err != nil {
			return err
		}
	}
	if targets, ok := tmp["targets"]; ok {
		if err := json.Unmarshal(targets, &panel.Targets); err != nil {
			return err
		}
	}
	if links, ok := tmp["links"]; ok {
		if err := json.Unmarshal(links, &panel.Links); err != nil {
			return err
		}
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

// Annotation is an entry of the list of annotations of a Grafana dashboard.
type Annotation struct {
	Name string `json:"name"`
	// BuiltIn is 1 for the annotation that Grafana adds to every dashboard ("Annotations & Alerts"),
	// that queries the annotations stored by Grafana itself.
	BuiltIn int `json:"builtIn"`
	// Enable is false when the annotation is not shown by default on the dashboard. Grafana considers it true when it's not set.
	Enable    *bool  `json:"enable"`
	IconColor string `json:"iconColor"`
	json.RawMessage
}

// Custom unmarshal to both store fields and keep raw data (used by the CUE-based migration logic).
// A field with an unexpected type is ignored instead of making the whole migration fail.
func (a *Annotation) UnmarshalJSON(data []byte) error {
	var tmp map[string]json.RawMessage
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	annotation := Annotation{}
	if name, ok := tmp["name"]; ok {
		_ = json.Unmarshal(name, &annotation.Name)
	}
	if builtIn, ok := tmp["builtIn"]; ok {
		_ = json.Unmarshal(builtIn, &annotation.BuiltIn)
	}
	if enable, ok := tmp["enable"]; ok {
		// Decoded apart, so a value that is not a boolean leaves the field unset instead of setting it to false.
		var value *bool
		if json.Unmarshal(enable, &value) == nil {
			annotation.Enable = value
		}
	}
	if iconColor, ok := tmp["iconColor"]; ok {
		_ = json.Unmarshal(iconColor, &annotation.IconColor)
	}
	var err error
	annotation.RawMessage, err = json.Marshal(tmp)
	if err != nil {
		return err
	}
	*a = annotation
	return nil
}

// Annotations is the annotations section of a Grafana dashboard, e.g. {"list": [...]}.
type Annotations struct {
	List []Annotation `json:"list"`
}

// UnmarshalJSON decodes the annotations best-effort: an annotation that can't be decoded is ignored, and an
// annotations section that is not an object leaves the list empty, instead of making the whole migration fail.
func (a *Annotations) UnmarshalJSON(data []byte) error {
	var tmp struct {
		List []json.RawMessage `json:"list"`
	}
	if json.Unmarshal(data, &tmp) != nil {
		return nil
	}
	var list []Annotation
	for _, rawAnnotation := range tmp.List {
		var annotation Annotation
		if json.Unmarshal(rawAnnotation, &annotation) == nil {
			list = append(list, annotation)
		}
	}
	a.List = list
	return nil
}

// DefaultValue returns the current value of the variable, or nil when it has none.
func (v *TemplateVar) DefaultValue() *variable.DefaultValue {
	if v.Current == nil {
		return nil
	}
	return v.Current.Value
}

// LenientString is a string field of a Grafana dashboard that is decoded best-effort: a JSON value that is not a
// string (e.g. `"refresh": false`, written by older Grafana versions when auto-refresh is off) is decoded as an empty
// string, instead of making the whole migration fail.
type LenientString string

func (s *LenientString) UnmarshalJSON(data []byte) error {
	var value string
	_ = json.Unmarshal(data, &value)
	*s = LenientString(value)
	return nil
}

// TimeRange is the default time range of a Grafana dashboard, e.g. {"from": "now-6h", "to": "now"}.
type TimeRange struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// UnmarshalJSON decodes the time range best-effort: a value that is not an object of strings leaves the time range
// empty (the migration then uses the default duration of Perses), instead of making the whole migration fail.
func (t *TimeRange) UnmarshalJSON(data []byte) error {
	type plain TimeRange
	var tmp plain
	if json.Unmarshal(data, &tmp) == nil {
		*t = TimeRange(tmp)
	}
	return nil
}

// Dashboard is the classic JSON model of a Grafana dashboard, restricted to the fields used by the migration.
type Dashboard struct {
	UID        string   `json:"uid,omitempty"`
	Title      string   `json:"title"`
	Tags       []string `json:"tags"`
	Panels     []Panel  `json:"panels"`
	Links      []Link   `json:"links"`
	Templating struct {
		List []TemplateVar `json:"list"`
	} `json:"templating"`
	Annotations Annotations `json:"annotations"`
	// Time is the default time range of the dashboard. It is nil when the dashboard has none.
	Time *TimeRange `json:"time"`
	// Refresh is the default auto-refresh interval of the dashboard, e.g. "1m". It is empty when auto-refresh is off.
	Refresh LenientString `json:"refresh"`
	// Timezone is the timezone of the dashboard: "browser", "utc", an IANA timezone name, or empty.
	Timezone LenientString `json:"timezone"`
}

// dashboardResource is a dashboard resource of the API group dashboard.grafana.app, available since Grafana 12.
type dashboardResource struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
	Metadata   struct {
		// Name is the UID of the dashboard.
		Name string `json:"name"`
	} `json:"metadata"`
	Spec json.RawMessage `json:"spec"`
}

// convertResource converts a dashboard resource of the API group dashboard.grafana.app into the classic JSON
// model of the Grafana dashboards. The versions v0alpha1, v1beta1 and v1 of the resources hold the classic JSON model
// in their spec, while the versions v2beta1 and v2 use the schema v2.
func convertResource(data []byte) ([]byte, error) {
	resource := dashboardResource{}
	if err := json.Unmarshal(data, &resource); err != nil {
		return nil, fmt.Errorf("unable to decode the Grafana dashboard resource: %w", err)
	}
	if resource.Kind != dashboardKind {
		return nil, fmt.Errorf("the Grafana resource of kind %q is not a dashboard", resource.Kind)
	}
	if len(resource.Spec) == 0 || string(resource.Spec) == "null" {
		return nil, fmt.Errorf("the Grafana dashboard %q has no spec", resource.Metadata.Name)
	}
	switch strings.TrimPrefix(resource.APIVersion, dashboardAPIGroup) {
	case "v0alpha1", "v1beta1", "v1":
		return unwrapClassicResource(resource)
	case "v2beta1", "v2":
		classicDashboard, err := v2.ToClassic(resource.Metadata.Name, resource.Spec)
		if err != nil {
			return nil, fmt.Errorf("unable to convert the Grafana schema v2 dashboard %q: %w", resource.Metadata.Name, err)
		}
		return classicDashboard, nil
	default:
		return nil, fmt.Errorf("the Grafana dashboard schema %q is not supported, please export the dashboard using the classic JSON model or the schema v2", resource.APIVersion)
	}
}

// unwrapClassicResource returns the classic JSON model held by the spec of the resource.
func unwrapClassicResource(resource dashboardResource) ([]byte, error) {
	spec := map[string]json.RawMessage{}
	if err := json.Unmarshal(resource.Spec, &spec); err != nil {
		return nil, fmt.Errorf("unable to decode the spec of the Grafana dashboard: %w", err)
	}
	var uid string
	if rawUID, ok := spec["uid"]; ok {
		_ = json.Unmarshal(rawUID, &uid)
	}
	if len(uid) == 0 && len(resource.Metadata.Name) > 0 {
		spec["uid"], _ = json.Marshal(resource.Metadata.Name)
	}
	return json.Marshal(spec)
}

func (d *Dashboard) UnmarshalJSON(data []byte) error {
	var header struct {
		APIVersion string `json:"apiVersion"`
	}
	if err := json.Unmarshal(data, &header); err == nil && strings.HasPrefix(header.APIVersion, dashboardAPIGroup) {
		classicDashboard, convertErr := convertResource(data)
		if convertErr != nil {
			return convertErr
		}
		data = classicDashboard
	}
	tmp := &Dashboard{}
	type plain Dashboard
	if err := json.Unmarshal(data, (*plain)(tmp)); err != nil {
		return err
	}
	tmp.rearrangePanelsWithinExpandedRows()
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
func (d *Dashboard) rearrangePanelsWithinExpandedRows() {
	var newPanelList []Panel
	var parentRow *Panel
	for _, panel := range d.Panels {
		if panel.Type == PanelRowType {
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
