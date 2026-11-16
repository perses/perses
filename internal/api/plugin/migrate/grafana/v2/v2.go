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

// Package v2 converts the dashboards using the schema v2 of Grafana (the versions v2beta1 and v2 of the resources of
// the API group dashboard.grafana.app, available since Grafana 12) into the classic JSON model of the Grafana
// dashboards. The converted dashboards are then migrated by the same code, and with the same migration scripts of the
// plugins, as the dashboards exported with the classic JSON model.
package v2

import (
	"encoding/json"
	"fmt"
	"math"
)

// The strings below are the ones of the classic JSON model used by this package. They are duplicated from the package
// migrate, which can't be imported without creating an import cycle.
const (
	panelRowType         = "row"
	panelsField          = "panels"
	constantVariableType = "constant"
	textboxVariableType  = "textbox"
)

const (
	// legacyStringValueKey is the key of the query spec holding a variable query that was a string in the classic
	// JSON model.
	legacyStringValueKey = "__legacyStringValue"
	gridColumns          = 24
	// gridUnitHeight is the height in pixels of a line of the Grafana grid, including the margin.
	gridUnitHeight = 38
	rowHeight      = 1
	// autoGridDefaultColumns is the default maximum number of columns of an AutoGridLayout.
	autoGridDefaultColumns = 3
	autoGridDefaultHeight  = 9
	// autoGridMaxHeight is the maximum height, in lines of the grid, of the panels of an AutoGridLayout. It prevents
	// a custom row height that is out of range from overflowing the positions of the panels.
	autoGridMaxHeight  = 1000
	mixedDatasourceUID = "-- Mixed --"
)

var (
	variableTypes = map[variableKind]string{
		queryVariable:      "query",
		textVariable:       textboxVariableType,
		constantVariable:   constantVariableType,
		datasourceVariable: "datasource",
		intervalVariable:   "interval",
		customVariable:     "custom",
		groupByVariable:    "groupby",
		adhocVariable:      "adhoc",
		switchVariable:     "switch",
	}
	variableHide = map[string]int{
		"dontHide":       0,
		"hideLabel":      1,
		"hideVariable":   2,
		"inControlsMenu": 3,
	}
	variableRefresh = map[string]int{
		"never":              0,
		"onDashboardLoad":    1,
		"onTimeRangeChanged": 2,
	}
	variableSort = map[string]int{
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
	// autoGridHeights is the height, in lines of the grid, of the panels of an AutoGridLayout for each rowHeightMode.
	autoGridHeights = map[string]int{
		"short":    5,
		"standard": autoGridDefaultHeight,
		"tall":     14,
	}
)

// ToClassic converts the spec of a dashboard using the schema v2 of Grafana into the classic JSON model. The uid is
// the name of the dashboard resource, as the spec doesn't hold it.
func ToClassic(uid string, spec json.RawMessage) ([]byte, error) {
	dashboard := dashboardSpec{}
	if err := json.Unmarshal(spec, &dashboard); err != nil {
		return nil, fmt.Errorf("unable to decode the spec: %w", err)
	}
	if dashboard.Tags == nil {
		dashboard.Tags = []string{}
	}
	c := &converter{
		elements:      dashboard.Elements,
		variables:     []map[string]any{},
		variableNames: make(map[string]bool),
		annotations:   []map[string]any{},
	}
	for _, v := range dashboard.Variables {
		c.addVariable(v)
	}
	for _, a := range dashboard.Annotations {
		c.annotations = append(c.annotations, convertAnnotation(a))
	}
	panels, _, err := c.convertLayout(dashboard.Layout, 0, 0)
	if err != nil {
		return nil, err
	}
	if panels == nil {
		panels = []map[string]any{}
	}
	classic := map[string]any{
		"uid":         uid,
		"title":       dashboard.Title,
		"tags":        dashboard.Tags,
		panelsField:   panels,
		"templating":  map[string]any{"list": c.variables},
		"annotations": map[string]any{"list": c.annotations},
		"refresh":     dashboard.TimeSettings.AutoRefresh,
		"timezone":    dashboard.TimeSettings.Timezone,
	}
	if len(dashboard.Description) > 0 {
		classic["description"] = dashboard.Description
	}
	if len(dashboard.Links) > 0 {
		// The dashboard links have the same fields in both models.
		classic["links"] = dashboard.Links
	}
	if len(dashboard.TimeSettings.From) > 0 || len(dashboard.TimeSettings.To) > 0 {
		classic["time"] = map[string]string{"from": dashboard.TimeSettings.From, "to": dashboard.TimeSettings.To}
	}
	return json.Marshal(classic)
}

// rowRef identifies a row of the classic JSON model that was emitted by the converter.
type rowRef struct {
	// id is the order of emission of the row, starting at 1. 0 means no row.
	id        int
	collapsed bool
}

type converter struct {
	elements      map[string]element
	variables     []map[string]any
	variableNames map[string]bool
	annotations   []map[string]any
	// rows is the number of rows emitted so far, and lastRow is the last one.
	rows    int
	lastRow rowRef
}

// field decodes the field of the spec. It returns false when the field is missing or can't be decoded into a T, so
// the callers can fall back to the default behavior.
func field[T any](spec map[string]json.RawMessage, key string) (T, bool) {
	raw, ok := spec[key]
	if !ok {
		var zero T
		return zero, false
	}
	return decode[T](raw)
}

func decode[T any](raw json.RawMessage) (T, bool) {
	var value T
	if err := json.Unmarshal(raw, &value); err != nil {
		var zero T
		return zero, false
	}
	return value, true
}

// addVariable adds the variable to the dashboard, unless a variable with the same name already exists.
func (c *converter) addVariable(v variable) {
	name, _ := field[string](v.Spec, "name")
	if c.variableNames[name] {
		return
	}
	c.variableNames[name] = true
	c.variables = append(c.variables, convertVariable(v))
}

// addSectionVariablesAndAnnotations adds the variables and the annotations of a row or a tab to the dashboard, as
// the classic JSON model has no variables or annotations scoped to a row or a tab.
func (c *converter) addSectionVariablesAndAnnotations(s section) {
	for _, v := range s.Spec.Variables {
		c.addVariable(v)
	}
	for _, a := range s.Spec.Annotations {
		c.annotations = append(c.annotations, convertAnnotation(a))
	}
}

// convertLayout converts the layout into panels of the classic JSON model, placed from the line y of the grid. Like
// in the classic JSON model, the positions are absolute, and the panels of an expanded row follow the row instead of
// being nested in it. The parent is the ID of the row holding the layout, or 0 for the layout of the dashboard. It
// returns the panels and the line where the layout ends.
func (c *converter) convertLayout(l layout, y int, parent int) ([]map[string]any, int, error) {
	switch l.Kind {
	case "":
		return nil, y, nil
	case gridLayout:
		return c.convertGridLayout(l, y)
	case autoGridLayout:
		return c.convertAutoGridLayout(l, y)
	case rowsLayout:
		return c.convertSections(l.Spec.Rows, rowSection, y, parent)
	case tabsLayout:
		// The classic JSON model has no tabs, so every tab becomes an expanded row.
		return c.convertSections(l.Spec.Tabs, tabSection, y, parent)
	default:
		return nil, y, fmt.Errorf("unsupported layout kind %q", l.Kind)
	}
}

func (c *converter) convertGridLayout(l layout, y int) ([]map[string]any, int, error) {
	var panels []map[string]any
	end := y
	for _, item := range l.Spec.Items {
		panel, ok, err := c.convertElement(item.Spec.Element.Name)
		if err != nil {
			return nil, y, err
		}
		if !ok {
			continue
		}
		panel["gridPos"] = gridPos{X: item.Spec.X, Y: y + item.Spec.Y, W: item.Spec.Width, H: item.Spec.Height}
		if r := item.Spec.Repeat; r != nil && len(r.Value) > 0 {
			panel["repeat"] = r.Value
			if len(r.Direction) > 0 {
				panel["repeatDirection"] = r.Direction
			}
			if r.MaxPerRow != nil {
				panel["maxPerRow"] = *r.MaxPerRow
			}
		}
		panels = append(panels, panel)
		end = max(end, y+item.Spec.Y+item.Spec.Height)
	}
	return panels, end, nil
}

// convertAutoGridLayout places the panels of an AutoGridLayout on the grid, from left to right and then from top to
// bottom, with the size Grafana gives them.
func (c *converter) convertAutoGridLayout(l layout, y int) ([]map[string]any, int, error) {
	columns := autoGridDefaultColumns
	if l.Spec.MaxColumnCount >= 1 {
		// The number is clamped before the conversion, as the conversion of a float that doesn't fit in an int is
		// implementation-dependent.
		columns = int(min(l.Spec.MaxColumnCount, gridColumns))
	}
	width := gridColumns / columns
	height := autoGridDefaultHeight
	if h, ok := autoGridHeights[l.Spec.RowHeightMode]; ok {
		height = h
	} else if l.Spec.RowHeightMode == "custom" && l.Spec.RowHeight > 0 {
		height = int(min(math.Ceil(l.Spec.RowHeight/gridUnitHeight), autoGridMaxHeight))
	}
	var panels []map[string]any
	for _, item := range l.Spec.Items {
		panel, ok, err := c.convertElement(item.Spec.Element.Name)
		if err != nil {
			return nil, y, err
		}
		if !ok {
			continue
		}
		i := len(panels)
		panel["gridPos"] = gridPos{X: (i % columns) * width, Y: y + (i/columns)*height, W: width, H: height}
		if r := item.Spec.Repeat; r != nil && len(r.Value) > 0 {
			panel["repeat"] = r.Value
			panel["repeatDirection"] = "h"
			panel["maxPerRow"] = columns
		}
		panels = append(panels, panel)
	}
	lines := (len(panels) + columns - 1) / columns
	return panels, y + lines*height, nil
}

// landsInParentGroup returns true when a panel emitted now, without row, is moved by the migration to the panel group
// of the parent row (or at the top of the dashboard for the parent 0), which is where the panels of a row without
// header belong. A panel emitted after a row is moved to this row if it is expanded, and to the top of the dashboard
// if it is collapsed.
func (c *converter) landsInParentGroup(parent int) bool {
	if c.lastRow.id != parent {
		return false
	}
	return parent == 0 || !c.lastRow.collapsed
}

// convertSections converts the rows of a RowsLayout, or the tabs of a TabsLayout, into rows of the classic JSON model.
func (c *converter) convertSections(sections []section, kind sectionKind, y int, parent int) ([]map[string]any, int, error) {
	var panels []map[string]any
	for _, s := range sections {
		c.addSectionVariablesAndAnnotations(s)
		spec := s.Spec
		hidden := kind == rowSection && spec.HideHeader
		if hidden && c.landsInParentGroup(parent) {
			// A row without header has no row in the classic JSON model: its panels are placed directly on the grid.
			// It's only done when the panels stay in the right panel group once migrated, otherwise they would be
			// merged into the previous row, or moved to the top of the dashboard.
			sectionPanels, end, err := c.convertLayout(spec.Layout, y, parent)
			if err != nil {
				return nil, y, err
			}
			panels = append(panels, sectionPanels...)
			y = end
			continue
		}
		// A row without header that can't be placed directly keeps its position with an expanded row.
		collapsed := spec.Collapse && !hidden && kind == rowSection
		c.rows++
		c.lastRow = rowRef{id: c.rows, collapsed: collapsed}
		row := map[string]any{
			"type":      panelRowType,
			"title":     spec.Title,
			"collapsed": collapsed,
			"gridPos":   gridPos{X: 0, Y: y, W: gridColumns, H: rowHeight},
			panelsField: []map[string]any{},
		}
		if spec.Repeat != nil && len(spec.Repeat.Value) > 0 {
			row["repeat"] = spec.Repeat.Value
		}
		sectionPanels, end, err := c.convertLayout(spec.Layout, y+rowHeight, c.lastRow.id)
		if err != nil {
			return nil, y, err
		}
		isNested := spec.Layout.Kind == rowsLayout || spec.Layout.Kind == tabsLayout
		if collapsed && !isNested {
			// The panels of a collapsed row are nested in it, and the row takes a single line.
			if len(sectionPanels) > 0 {
				row[panelsField] = sectionPanels
			}
			panels = append(panels, row)
			y += rowHeight
			continue
		}
		// The classic JSON model has no nested rows, so the rows of a nested layout follow the row.
		panels = append(panels, row)
		panels = append(panels, sectionPanels...)
		y = end
	}
	return panels, y, nil
}

// convertElement returns the panel of the classic JSON model for the element. It returns false when the element
// doesn't exist, so the layout item referencing it can be skipped.
func (c *converter) convertElement(name string) (map[string]any, bool, error) {
	e, ok := c.elements[name]
	if !ok {
		return nil, false, nil
	}
	switch e.Kind {
	case panelElement:
		panel, err := convertPanel(name, e.Spec)
		if err != nil {
			return nil, false, err
		}
		return panel, true, nil
	case libraryPanelElement:
		// The library panel keeps the same fields (id, title and libraryPanel) in both models.
		panel := map[string]any{}
		if err := json.Unmarshal(e.Spec, &panel); err != nil {
			return nil, false, fmt.Errorf("unable to decode the library panel %q: %w", name, err)
		}
		return panel, true, nil
	default:
		// Like for an unknown panel type of the classic JSON model, keeping the unknown kind as type lets the
		// migration replace the element with a placeholder.
		panel := map[string]any{"type": string(e.Kind)}
		if spec, isDecoded := decode[map[string]json.RawMessage](e.Spec); isDecoded {
			if title, hasTitle := field[string](spec, "title"); hasTitle {
				panel["title"] = title
			}
		}
		return panel, true, nil
	}
}

func convertPanel(name string, rawSpec json.RawMessage) (map[string]any, error) {
	spec := panelSpec{}
	if err := json.Unmarshal(rawSpec, &spec); err != nil {
		return nil, fmt.Errorf("unable to decode the panel %q: %w", name, err)
	}
	queries := spec.Data.Spec
	panel := make(map[string]any, len(queries.QueryOptions)+12)
	// The query options (interval, maxDataPoints, timeFrom, etc.) have the same names in both models.
	for key, value := range queries.QueryOptions {
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
	targets := make([]map[string]any, 0, len(queries.Queries))
	var datasources []datasourceRef
	for _, query := range queries.Queries {
		target := convertQuerySpec(query.Spec.Query.Spec)
		target["refId"] = query.Spec.RefID
		if query.Spec.Hidden {
			target["hide"] = true
		}
		if ref := convertDatasource(query.Spec.Query.Group, query.Spec.Query.Datasource); ref != nil {
			target["datasource"] = ref
			datasources = append(datasources, *ref)
		}
		targets = append(targets, target)
	}
	panel["targets"] = targets
	if ref := panelDatasource(datasources); ref != nil {
		panel["datasource"] = ref
	}
	if len(queries.Transformations) > 0 {
		transformations := make([]map[string]any, 0, len(queries.Transformations))
		for _, t := range queries.Transformations {
			transformations = append(transformations, convertTransformation(t))
		}
		panel["transformations"] = transformations
	}
	return panel, nil
}

// panelDatasource returns the datasource of a panel of the classic JSON model, given the datasources of its queries.
func panelDatasource(datasources []datasourceRef) *datasourceRef {
	if len(datasources) == 0 {
		return nil
	}
	for _, ds := range datasources[1:] {
		if ds != datasources[0] {
			return &datasourceRef{Type: "datasource", UID: mixedDatasourceUID}
		}
	}
	return &datasources[0]
}

func convertTransformation(t transformation) map[string]any {
	result := make(map[string]any, len(t.Spec)+1)
	for key, value := range t.Spec {
		result[key] = value
	}
	if len(t.Group) > 0 {
		result["id"] = t.Group
	} else if _, ok := result["id"]; !ok && t.Kind != "Transformation" {
		// In v2beta1, the kind of the transformation is its ID.
		result["id"] = t.Kind
	}
	return result
}

// convertQuerySpec returns the fields of a query of the classic JSON model, given the spec of the query.
func convertQuerySpec(spec map[string]json.RawMessage) map[string]any {
	query := make(map[string]any, len(spec))
	for key, value := range spec {
		if key == legacyStringValueKey {
			query["query"] = value
			continue
		}
		query[key] = value
	}
	return query
}

// convertDatasource returns the datasource reference of the classic JSON model, or nil if there is none. In the
// schema v2, the group is the type of the datasource and the name of the datasource is its UID.
func convertDatasource(group string, ds *datasource) *datasourceRef {
	ref := datasourceRef{Type: group}
	if ds != nil {
		ref.UID = ds.Name
	}
	if ref == (datasourceRef{}) {
		return nil
	}
	return &ref
}

func convertVariable(v variable) map[string]any {
	result := make(map[string]any, len(v.Spec)+2)
	for key, value := range v.Spec {
		result[key] = value
	}
	variableType, ok := variableTypes[v.Kind]
	if !ok {
		// Keeping the unknown kind as type lets the migration replace the variable with a placeholder, like for an
		// unknown type of the classic JSON model.
		variableType = string(v.Kind)
	}
	result["type"] = variableType
	convertEnum(result, v.Spec, "hide", variableHide)
	convertEnum(result, v.Spec, "refresh", variableRefresh)
	convertEnum(result, v.Spec, "sort", variableSort)
	switch v.Kind {
	case queryVariable:
		if query, ok := field[dataQuery](v.Spec, "query"); ok {
			if legacyQuery, isLegacy := query.Spec[legacyStringValueKey]; isLegacy {
				result["query"] = legacyQuery
			} else {
				result["query"] = convertQuerySpec(query.Spec)
			}
			if ref := convertDatasource(query.Group, query.Datasource); ref != nil {
				result["datasource"] = ref
			}
		}
	case datasourceVariable:
		// The classic JSON model stores the type of the datasources to list in the query.
		if pluginID, ok := v.Spec["pluginId"]; ok {
			result["query"] = pluginID
		}
	case switchVariable:
		// The current value of a switch variable is a string, while it's an object in the classic JSON model.
		if current, ok := field[string](v.Spec, "current"); ok {
			result["current"] = map[string]string{"text": current, "value": current}
		}
	case groupByVariable, adhocVariable:
		if ref := convertDatasource(v.Group, v.Datasource); ref != nil {
			result["datasource"] = ref
		}
	}
	return result
}

// convertEnum replaces the value of the field, a string in the schema v2, with the number used by the classic JSON
// model. An unknown value is removed, so the default value applies.
func convertEnum(result map[string]any, spec map[string]json.RawMessage, key string, values map[string]int) {
	value, ok := field[string](spec, key)
	if !ok {
		return
	}
	if number, isKnown := values[value]; isKnown {
		result[key] = number
	} else {
		delete(result, key)
	}
}

func convertAnnotation(a annotation) map[string]any {
	result := map[string]any{}
	// The fields specific to the datasource are in legacyOptions and in the spec of the query, while they are
	// directly in the annotation in the classic JSON model.
	if legacyOptions, ok := field[map[string]json.RawMessage](a.Spec, "legacyOptions"); ok {
		for key, value := range legacyOptions {
			result[key] = value
		}
	}
	if query, ok := field[dataQuery](a.Spec, "query"); ok {
		for key, value := range convertQuerySpec(query.Spec) {
			result[key] = value
		}
		if ref := convertDatasource(query.Group, query.Datasource); ref != nil {
			result["datasource"] = ref
		}
	}
	for key, value := range a.Spec {
		if key != "query" && key != "legacyOptions" && key != "builtIn" {
			result[key] = value
		}
	}
	if builtIn, ok := field[bool](a.Spec, "builtIn"); ok && builtIn {
		// builtIn is a number in the classic JSON model.
		result["builtIn"] = 1
	}
	return result
}

func setIfNotEmpty(result map[string]any, key string, value json.RawMessage) {
	if len(value) > 0 && string(value) != "null" {
		result[key] = value
	}
}
