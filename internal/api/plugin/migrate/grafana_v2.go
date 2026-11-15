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
	"math"
	"strings"
)

// Since Grafana 12, the dashboards are also available as resources of the API group dashboard.grafana.app. The
// versions v0alpha1, v1beta1 and v1 of these resources hold the classic JSON model in their spec, while the versions
// v2beta1 and v2 (the schema v2) describe the dashboard with another model. This file converts these resources into
// the classic JSON model, so they are migrated by the same code, and with the same migration scripts of the plugins,
// as the dashboards exported with the classic JSON model.

const (
	grafanaDashboardKind = "Dashboard"
	// grafanaLegacyStringValueKey is the key of the query spec holding a variable query that was a string in the
	// classic JSON model.
	grafanaLegacyStringValueKey = "__legacyStringValue"
	grafanaGridColumns          = 24
	// grafanaGridUnitHeight is the height in pixels of a line of the Grafana grid, including the margin.
	grafanaGridUnitHeight = 38
	grafanaRowHeight      = 1
	// grafanaAutoGridDefaultColumns is the default maximum number of columns of an AutoGridLayout.
	grafanaAutoGridDefaultColumns = 3
	grafanaAutoGridDefaultHeight  = 9
	grafanaMixedDatasourceUID     = "-- Mixed --"
)

var (
	grafanaV2VariableTypes = map[string]string{
		"QueryVariable":      "query",
		"TextVariable":       grafanaTextboxVariableType,
		"ConstantVariable":   grafanaConstantVariableType,
		"DatasourceVariable": "datasource",
		"IntervalVariable":   "interval",
		"CustomVariable":     "custom",
		"GroupByVariable":    "groupby",
		"AdhocVariable":      "adhoc",
		"SwitchVariable":     "switch",
	}
	grafanaV2VariableHide = map[string]int{
		"dontHide":       0,
		"hideLabel":      1,
		"hideVariable":   2,
		"inControlsMenu": 3,
	}
	grafanaV2VariableRefresh = map[string]int{
		"never":              0,
		"onDashboardLoad":    1,
		"onTimeRangeChanged": 2,
	}
	grafanaV2VariableSort = map[string]int{
		"disabled":                        0,
		"alphabeticalAsc":                 1,
		"alphabeticalDesc":                2,
		"numericalAsc":                    3,
		"numericalDesc":                   4,
		"alphabeticalCaseInsensitiveAsc":  5,
		"alphabeticalCaseInsensitiveDesc": 6,
		"naturalAsc":                      7,
		"naturalDesc":                     8,
	}
	// grafanaV2AutoGridHeights is the height, in lines of the grid, of the panels of an AutoGridLayout for each
	// rowHeightMode.
	grafanaV2AutoGridHeights = map[string]int{
		"short":    5,
		"standard": grafanaAutoGridDefaultHeight,
		"tall":     14,
	}
)

type grafanaResource struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
	Metadata   struct {
		// Name is the UID of the dashboard.
		Name string `json:"name"`
	} `json:"metadata"`
	Spec json.RawMessage `json:"spec"`
}

type grafanaV2Kind struct {
	Kind string          `json:"kind"`
	Spec json.RawMessage `json:"spec"`
}

type grafanaV2DatasourceRef struct {
	Name string `json:"name"`
}

type grafanaV2DataQuery struct {
	// Group is the type of the datasource.
	Group      string                     `json:"group"`
	Datasource *grafanaV2DatasourceRef    `json:"datasource"`
	Spec       map[string]json.RawMessage `json:"spec"`
}

type grafanaV2Transformation struct {
	Kind string `json:"kind"`
	// Group is the ID of the transformation. In v2beta1, the ID is the kind instead.
	Group string                     `json:"group"`
	Spec  map[string]json.RawMessage `json:"spec"`
}

type grafanaV2PanelSpec struct {
	ID          json.RawMessage `json:"id"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Links       json.RawMessage `json:"links"`
	Transparent bool            `json:"transparent"`
	Data        struct {
		Spec struct {
			Queries []struct {
				Spec struct {
					Query  grafanaV2DataQuery `json:"query"`
					RefID  string             `json:"refId"`
					Hidden bool               `json:"hidden"`
				} `json:"spec"`
			} `json:"queries"`
			Transformations []grafanaV2Transformation  `json:"transformations"`
			QueryOptions    map[string]json.RawMessage `json:"queryOptions"`
		} `json:"spec"`
	} `json:"data"`
	VizConfig struct {
		// Group is the type of the panel.
		Group   string `json:"group"`
		Version string `json:"version"`
		Spec    struct {
			Options     json.RawMessage `json:"options"`
			FieldConfig json.RawMessage `json:"fieldConfig"`
		} `json:"spec"`
	} `json:"vizConfig"`
}

type grafanaV2Variable struct {
	Kind string `json:"kind"`
	// Group and Datasource are the datasource of the GroupByVariable and AdhocVariable.
	Group      string                     `json:"group"`
	Datasource *grafanaV2DatasourceRef    `json:"datasource"`
	Spec       map[string]json.RawMessage `json:"spec"`
}

type grafanaV2Annotation struct {
	Spec map[string]json.RawMessage `json:"spec"`
}

type grafanaV2Repeat struct {
	Value     string `json:"value"`
	Direction string `json:"direction"`
	MaxPerRow *int   `json:"maxPerRow"`
}

type grafanaV2LayoutItem struct {
	Spec struct {
		X       int `json:"x"`
		Y       int `json:"y"`
		Width   int `json:"width"`
		Height  int `json:"height"`
		Element struct {
			Name string `json:"name"`
		} `json:"element"`
		Repeat *grafanaV2Repeat `json:"repeat"`
	} `json:"spec"`
}

// grafanaV2Section is a row of a RowsLayout or a tab of a TabsLayout.
type grafanaV2Section struct {
	Spec struct {
		Title       string                `json:"title"`
		Collapse    bool                  `json:"collapse"`
		HideHeader  bool                  `json:"hideHeader"`
		Repeat      *grafanaV2Repeat      `json:"repeat"`
		Layout      grafanaV2Layout       `json:"layout"`
		Variables   []grafanaV2Variable   `json:"variables"`
		Annotations []grafanaV2Annotation `json:"annotations"`
	} `json:"spec"`
}

type grafanaV2Layout struct {
	Kind string `json:"kind"`
	Spec struct {
		// Items are the items of a GridLayout or of an AutoGridLayout.
		Items []grafanaV2LayoutItem `json:"items"`
		// Rows are the rows of a RowsLayout.
		Rows []grafanaV2Section `json:"rows"`
		// Tabs are the tabs of a TabsLayout.
		Tabs []grafanaV2Section `json:"tabs"`
		// The fields below are the settings of an AutoGridLayout.
		MaxColumnCount float64 `json:"maxColumnCount"`
		RowHeightMode  string  `json:"rowHeightMode"`
		RowHeight      float64 `json:"rowHeight"`
	} `json:"spec"`
}

type grafanaV2DashboardSpec struct {
	Title        string          `json:"title"`
	Description  string          `json:"description"`
	Tags         []string        `json:"tags"`
	Links        json.RawMessage `json:"links"`
	TimeSettings struct {
		From        string `json:"from"`
		To          string `json:"to"`
		Timezone    string `json:"timezone"`
		AutoRefresh string `json:"autoRefresh"`
	} `json:"timeSettings"`
	Annotations []grafanaV2Annotation    `json:"annotations"`
	Variables   []grafanaV2Variable      `json:"variables"`
	Elements    map[string]grafanaV2Kind `json:"elements"`
	Layout      grafanaV2Layout          `json:"layout"`
}

// convertGrafanaResource converts a dashboard resource of the API group dashboard.grafana.app into the classic JSON
// model of the Grafana dashboards.
func convertGrafanaResource(data []byte) ([]byte, error) {
	resource := grafanaResource{}
	if err := json.Unmarshal(data, &resource); err != nil {
		return nil, fmt.Errorf("unable to decode the Grafana dashboard resource: %w", err)
	}
	if resource.Kind != grafanaDashboardKind {
		return nil, fmt.Errorf("the Grafana resource of kind %q is not a dashboard", resource.Kind)
	}
	if len(resource.Spec) == 0 || string(resource.Spec) == "null" {
		return nil, fmt.Errorf("the Grafana dashboard %q has no spec", resource.Metadata.Name)
	}
	switch strings.TrimPrefix(resource.APIVersion, grafanaDashboardAPIGroup) {
	case "v0alpha1", "v1beta1", "v1":
		return unwrapGrafanaClassicResource(resource)
	case "v2beta1", "v2":
		return convertGrafanaV2Resource(resource)
	default:
		return nil, fmt.Errorf("the Grafana dashboard schema %q is not supported, please export the dashboard using the classic JSON model or the schema v2", resource.APIVersion)
	}
}

// unwrapGrafanaClassicResource returns the classic JSON model held by the spec of the resource.
func unwrapGrafanaClassicResource(resource grafanaResource) ([]byte, error) {
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

func convertGrafanaV2Resource(resource grafanaResource) ([]byte, error) {
	spec := grafanaV2DashboardSpec{}
	if err := json.Unmarshal(resource.Spec, &spec); err != nil {
		return nil, fmt.Errorf("unable to decode the spec of the Grafana v2 dashboard: %w", err)
	}
	if spec.Tags == nil {
		spec.Tags = []string{}
	}
	c := &grafanaV2Converter{
		elements:      spec.Elements,
		variables:     []map[string]any{},
		variableNames: make(map[string]bool),
		annotations:   []map[string]any{},
	}
	for _, v := range spec.Variables {
		c.addVariable(v)
	}
	for _, a := range spec.Annotations {
		c.annotations = append(c.annotations, convertGrafanaV2Annotation(a))
	}
	panels, _, err := c.convertLayout(spec.Layout, 0)
	if err != nil {
		return nil, err
	}
	if panels == nil {
		panels = []map[string]any{}
	}
	dashboard := map[string]any{
		"uid":              resource.Metadata.Name,
		"title":            spec.Title,
		"tags":             spec.Tags,
		grafanaPanelsField: panels,
		"templating":       map[string]any{"list": c.variables},
		"annotations":      map[string]any{"list": c.annotations},
		"refresh":          spec.TimeSettings.AutoRefresh,
		"timezone":         spec.TimeSettings.Timezone,
	}
	if len(spec.Description) > 0 {
		dashboard["description"] = spec.Description
	}
	if len(spec.Links) > 0 {
		// The dashboard links have the same fields in both models.
		dashboard["links"] = spec.Links
	}
	if len(spec.TimeSettings.From) > 0 || len(spec.TimeSettings.To) > 0 {
		dashboard["time"] = map[string]string{"from": spec.TimeSettings.From, "to": spec.TimeSettings.To}
	}
	return json.Marshal(dashboard)
}

type grafanaV2Converter struct {
	elements      map[string]grafanaV2Kind
	variables     []map[string]any
	variableNames map[string]bool
	annotations   []map[string]any
}

// addVariable adds the variable to the dashboard, unless a variable with the same name already exists. As the classic
// JSON model has no variables scoped to a row or a tab, these variables are added to the dashboard.
func (c *grafanaV2Converter) addVariable(v grafanaV2Variable) {
	var name string
	if rawName, ok := v.Spec["name"]; ok {
		_ = json.Unmarshal(rawName, &name)
	}
	if c.variableNames[name] {
		return
	}
	c.variableNames[name] = true
	c.variables = append(c.variables, convertGrafanaV2Variable(v))
}

// addSectionVariablesAndAnnotations adds the variables and the annotations of a row or a tab to the dashboard, as
// the classic JSON model has no variables or annotations scoped to a row or a tab.
func (c *grafanaV2Converter) addSectionVariablesAndAnnotations(section grafanaV2Section) {
	for _, v := range section.Spec.Variables {
		c.addVariable(v)
	}
	for _, a := range section.Spec.Annotations {
		c.annotations = append(c.annotations, convertGrafanaV2Annotation(a))
	}
}

// convertLayout converts the layout into panels of the classic JSON model, placed from the line y of the grid. Like
// in the classic JSON model, the positions are absolute, and the panels of an expanded row follow the row instead of
// being nested in it. It returns the panels and the line where the layout ends.
func (c *grafanaV2Converter) convertLayout(layout grafanaV2Layout, y int) ([]map[string]any, int, error) {
	switch layout.Kind {
	case "":
		return nil, y, nil
	case "GridLayout":
		return c.convertGridLayout(layout, y)
	case "AutoGridLayout":
		return c.convertAutoGridLayout(layout, y)
	case "RowsLayout":
		return c.convertSections(layout.Spec.Rows, false, y)
	case "TabsLayout":
		// The classic JSON model has no tabs, so every tab becomes an expanded row.
		return c.convertSections(layout.Spec.Tabs, true, y)
	default:
		return nil, y, fmt.Errorf("the layout %q of the Grafana v2 dashboard is not supported", layout.Kind)
	}
}

func (c *grafanaV2Converter) convertGridLayout(layout grafanaV2Layout, y int) ([]map[string]any, int, error) {
	var panels []map[string]any
	end := y
	for _, item := range layout.Spec.Items {
		panel, err := c.convertElement(item.Spec.Element.Name)
		if err != nil {
			return nil, y, err
		}
		panel["gridPos"] = map[string]int{"x": item.Spec.X, "y": y + item.Spec.Y, "w": item.Spec.Width, "h": item.Spec.Height}
		if repeat := item.Spec.Repeat; repeat != nil && len(repeat.Value) > 0 {
			panel["repeat"] = repeat.Value
			if len(repeat.Direction) > 0 {
				panel["repeatDirection"] = repeat.Direction
			}
			if repeat.MaxPerRow != nil {
				panel["maxPerRow"] = *repeat.MaxPerRow
			}
		}
		panels = append(panels, panel)
		end = max(end, y+item.Spec.Y+item.Spec.Height)
	}
	return panels, end, nil
}

// convertAutoGridLayout places the panels of an AutoGridLayout on the grid, from left to right and then from top to
// bottom, with the size Grafana gives them.
func (c *grafanaV2Converter) convertAutoGridLayout(layout grafanaV2Layout, y int) ([]map[string]any, int, error) {
	columns := grafanaAutoGridDefaultColumns
	if layout.Spec.MaxColumnCount >= 1 {
		columns = min(int(layout.Spec.MaxColumnCount), grafanaGridColumns)
	}
	width := grafanaGridColumns / columns
	height := grafanaAutoGridDefaultHeight
	if h, ok := grafanaV2AutoGridHeights[layout.Spec.RowHeightMode]; ok {
		height = h
	} else if layout.Spec.RowHeightMode == "custom" && layout.Spec.RowHeight > 0 {
		height = int(math.Ceil(layout.Spec.RowHeight / grafanaGridUnitHeight))
	}
	var panels []map[string]any
	for i, item := range layout.Spec.Items {
		panel, err := c.convertElement(item.Spec.Element.Name)
		if err != nil {
			return nil, y, err
		}
		panel["gridPos"] = map[string]int{"x": (i % columns) * width, "y": y + (i/columns)*height, "w": width, "h": height}
		if repeat := item.Spec.Repeat; repeat != nil && len(repeat.Value) > 0 {
			panel["repeat"] = repeat.Value
			panel["repeatDirection"] = "h"
			panel["maxPerRow"] = columns
		}
		panels = append(panels, panel)
	}
	lines := (len(layout.Spec.Items) + columns - 1) / columns
	return panels, y + lines*height, nil
}

// convertSections converts the rows of a RowsLayout, or the tabs of a TabsLayout, into rows of the classic JSON model.
func (c *grafanaV2Converter) convertSections(sections []grafanaV2Section, areTabs bool, y int) ([]map[string]any, int, error) {
	var panels []map[string]any
	for _, section := range sections {
		c.addSectionVariablesAndAnnotations(section)
		spec := section.Spec
		if spec.HideHeader && !areTabs {
			// A row without header has no row in the classic JSON model: its panels are placed directly on the grid.
			sectionPanels, end, err := c.convertLayout(spec.Layout, y)
			if err != nil {
				return nil, y, err
			}
			panels = append(panels, sectionPanels...)
			y = end
			continue
		}
		collapsed := spec.Collapse && !areTabs
		row := map[string]any{
			"type":             grafanaPanelRowType,
			"title":            spec.Title,
			"collapsed":        collapsed,
			"gridPos":          map[string]int{"x": 0, "y": y, "w": grafanaGridColumns, "h": grafanaRowHeight},
			grafanaPanelsField: []map[string]any{},
		}
		if spec.Repeat != nil && len(spec.Repeat.Value) > 0 {
			row["repeat"] = spec.Repeat.Value
		}
		sectionPanels, end, err := c.convertLayout(spec.Layout, y+grafanaRowHeight)
		if err != nil {
			return nil, y, err
		}
		isNested := spec.Layout.Kind == "RowsLayout" || spec.Layout.Kind == "TabsLayout"
		if collapsed && !isNested {
			// The panels of a collapsed row are nested in it, and the row takes a single line.
			if len(sectionPanels) > 0 {
				row[grafanaPanelsField] = sectionPanels
			}
			panels = append(panels, row)
			y += grafanaRowHeight
			continue
		}
		// The classic JSON model has no nested rows, so the rows of a nested layout follow the row.
		panels = append(panels, row)
		panels = append(panels, sectionPanels...)
		y = end
	}
	return panels, y, nil
}

func (c *grafanaV2Converter) convertElement(name string) (map[string]any, error) {
	element, ok := c.elements[name]
	if !ok {
		return nil, fmt.Errorf("the element %q referenced by the layout of the Grafana v2 dashboard doesn't exist", name)
	}
	switch element.Kind {
	case "Panel":
		return convertGrafanaV2Panel(element.Spec)
	case "LibraryPanel":
		// The library panel keeps the same fields (id, title and libraryPanel) in both models.
		panel := map[string]any{}
		if err := json.Unmarshal(element.Spec, &panel); err != nil {
			return nil, fmt.Errorf("unable to decode the library panel %q of the Grafana v2 dashboard: %w", name, err)
		}
		return panel, nil
	default:
		return nil, fmt.Errorf("the element %q of the Grafana v2 dashboard has the unsupported kind %q", name, element.Kind)
	}
}

func convertGrafanaV2Panel(rawSpec json.RawMessage) (map[string]any, error) {
	spec := grafanaV2PanelSpec{}
	if err := json.Unmarshal(rawSpec, &spec); err != nil {
		return nil, fmt.Errorf("unable to decode a panel of the Grafana v2 dashboard: %w", err)
	}
	panel := make(map[string]any, len(spec.Data.Spec.QueryOptions)+12)
	// The query options (interval, maxDataPoints, timeFrom, etc.) have the same names in both models.
	for key, value := range spec.Data.Spec.QueryOptions {
		panel[key] = value
	}
	panel["type"] = spec.VizConfig.Group
	panel["title"] = spec.Title
	setIfNotEmpty(panel, "id", spec.ID)
	setIfNotEmpty(panel, "links", spec.Links)
	setIfNotEmpty(panel, "options", spec.VizConfig.Spec.Options)
	setIfNotEmpty(panel, "fieldConfig", spec.VizConfig.Spec.FieldConfig)
	if len(spec.Description) > 0 {
		panel["description"] = spec.Description
	}
	if len(spec.VizConfig.Version) > 0 {
		panel["pluginVersion"] = spec.VizConfig.Version
	}
	if spec.Transparent {
		panel["transparent"] = true
	}
	targets := make([]map[string]any, 0, len(spec.Data.Spec.Queries))
	var datasources []map[string]string
	for _, query := range spec.Data.Spec.Queries {
		target := convertGrafanaV2QuerySpec(query.Spec.Query.Spec)
		target["refId"] = query.Spec.RefID
		if query.Spec.Hidden {
			target["hide"] = true
		}
		if ref := grafanaV2DatasourceToClassic(query.Spec.Query.Group, query.Spec.Query.Datasource); ref != nil {
			target["datasource"] = ref
			datasources = append(datasources, ref)
		}
		targets = append(targets, target)
	}
	panel["targets"] = targets
	if ref := panelDatasource(datasources); ref != nil {
		panel["datasource"] = ref
	}
	if len(spec.Data.Spec.Transformations) > 0 {
		transformations := make([]map[string]any, 0, len(spec.Data.Spec.Transformations))
		for _, t := range spec.Data.Spec.Transformations {
			transformations = append(transformations, convertGrafanaV2Transformation(t))
		}
		panel["transformations"] = transformations
	}
	return panel, nil
}

// panelDatasource returns the datasource of a panel of the classic JSON model, given the datasources of its queries.
func panelDatasource(datasources []map[string]string) map[string]string {
	if len(datasources) == 0 {
		return nil
	}
	for _, ds := range datasources[1:] {
		if ds["type"] != datasources[0]["type"] || ds["uid"] != datasources[0]["uid"] {
			return map[string]string{"type": "datasource", "uid": grafanaMixedDatasourceUID}
		}
	}
	return datasources[0]
}

func convertGrafanaV2Transformation(t grafanaV2Transformation) map[string]any {
	transformation := make(map[string]any, len(t.Spec)+1)
	for key, value := range t.Spec {
		transformation[key] = value
	}
	if len(t.Group) > 0 {
		transformation["id"] = t.Group
	} else if _, ok := transformation["id"]; !ok && t.Kind != "Transformation" {
		// In v2beta1, the kind of the transformation is its ID.
		transformation["id"] = t.Kind
	}
	return transformation
}

// convertGrafanaV2QuerySpec returns the fields of a query of the classic JSON model, given the spec of the query.
func convertGrafanaV2QuerySpec(spec map[string]json.RawMessage) map[string]any {
	query := make(map[string]any, len(spec))
	for key, value := range spec {
		if key == grafanaLegacyStringValueKey {
			query["query"] = value
			continue
		}
		query[key] = value
	}
	return query
}

// grafanaV2DatasourceToClassic returns the datasource reference of the classic JSON model, or nil if there is none.
// In the schema v2, the group is the type of the datasource and the name of the datasource is its UID.
func grafanaV2DatasourceToClassic(group string, datasource *grafanaV2DatasourceRef) map[string]string {
	hasUID := datasource != nil && len(datasource.Name) > 0
	if len(group) == 0 && !hasUID {
		return nil
	}
	ref := map[string]string{}
	if len(group) > 0 {
		ref["type"] = group
	}
	if hasUID {
		ref["uid"] = datasource.Name
	}
	return ref
}

func convertGrafanaV2Variable(v grafanaV2Variable) map[string]any {
	variable := make(map[string]any, len(v.Spec)+2)
	for key, value := range v.Spec {
		variable[key] = value
	}
	variableType, ok := grafanaV2VariableTypes[v.Kind]
	if !ok {
		// Keeping the unknown kind as type lets the migration replace the variable with a placeholder, like for an
		// unknown type of the classic JSON model.
		variableType = v.Kind
	}
	variable["type"] = variableType
	convertGrafanaV2Enum(variable, v.Spec, "hide", grafanaV2VariableHide)
	convertGrafanaV2Enum(variable, v.Spec, "refresh", grafanaV2VariableRefresh)
	convertGrafanaV2Enum(variable, v.Spec, "sort", grafanaV2VariableSort)
	switch v.Kind {
	case "QueryVariable":
		query := grafanaV2DataQuery{}
		if rawQuery, ok := v.Spec["query"]; ok && json.Unmarshal(rawQuery, &query) == nil {
			if legacyQuery, isLegacy := query.Spec[grafanaLegacyStringValueKey]; isLegacy {
				variable["query"] = legacyQuery
			} else {
				variable["query"] = convertGrafanaV2QuerySpec(query.Spec)
			}
			if ref := grafanaV2DatasourceToClassic(query.Group, query.Datasource); ref != nil {
				variable["datasource"] = ref
			}
		}
	case "DatasourceVariable":
		// The classic JSON model stores the type of the datasources to list in the query.
		if pluginID, ok := v.Spec["pluginId"]; ok {
			variable["query"] = pluginID
		}
	case "SwitchVariable":
		// The current value of a switch variable is a string, while it's an object in the classic JSON model.
		var current string
		if rawCurrent, ok := v.Spec["current"]; ok && json.Unmarshal(rawCurrent, &current) == nil {
			variable["current"] = map[string]string{"text": current, "value": current}
		}
	case "GroupByVariable", "AdhocVariable":
		if ref := grafanaV2DatasourceToClassic(v.Group, v.Datasource); ref != nil {
			variable["datasource"] = ref
		}
	}
	return variable
}

// convertGrafanaV2Enum replaces the value of the field, a string in the schema v2, with the number used by the classic
// JSON model. An unknown value is removed, so the default value applies.
func convertGrafanaV2Enum(result map[string]any, spec map[string]json.RawMessage, field string, values map[string]int) {
	rawValue, ok := spec[field]
	if !ok {
		return
	}
	var value string
	if json.Unmarshal(rawValue, &value) != nil {
		return
	}
	if number, isKnown := values[value]; isKnown {
		result[field] = number
	} else {
		delete(result, field)
	}
}

func convertGrafanaV2Annotation(a grafanaV2Annotation) map[string]any {
	annotation := map[string]any{}
	// The fields specific to the datasource are in legacyOptions and in the spec of the query, while they are
	// directly in the annotation in the classic JSON model.
	legacyOptions := map[string]json.RawMessage{}
	if rawOptions, ok := a.Spec["legacyOptions"]; ok && json.Unmarshal(rawOptions, &legacyOptions) == nil {
		for key, value := range legacyOptions {
			annotation[key] = value
		}
	}
	query := grafanaV2DataQuery{}
	if rawQuery, ok := a.Spec["query"]; ok && json.Unmarshal(rawQuery, &query) == nil {
		for key, value := range convertGrafanaV2QuerySpec(query.Spec) {
			annotation[key] = value
		}
		if ref := grafanaV2DatasourceToClassic(query.Group, query.Datasource); ref != nil {
			annotation["datasource"] = ref
		}
	}
	for key, value := range a.Spec {
		if key != "query" && key != "legacyOptions" && key != "builtIn" {
			annotation[key] = value
		}
	}
	var builtIn bool
	if rawBuiltIn, ok := a.Spec["builtIn"]; ok && json.Unmarshal(rawBuiltIn, &builtIn) == nil && builtIn {
		// builtIn is a number in the classic JSON model.
		annotation["builtIn"] = 1
	}
	return annotation
}

func setIfNotEmpty(result map[string]any, key string, value json.RawMessage) {
	if len(value) > 0 && string(value) != "null" {
		result[key] = value
	}
}
