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

package v2

import "encoding/json"

type layoutKind string

const (
	gridLayout     layoutKind = "GridLayout"
	autoGridLayout layoutKind = "AutoGridLayout"
	rowsLayout     layoutKind = "RowsLayout"
	tabsLayout     layoutKind = "TabsLayout"
)

type elementKind string

const (
	panelElement        elementKind = "Panel"
	libraryPanelElement elementKind = "LibraryPanel"
)

type variableKind string

const (
	queryVariable      variableKind = "QueryVariable"
	textVariable       variableKind = "TextVariable"
	constantVariable   variableKind = "ConstantVariable"
	datasourceVariable variableKind = "DatasourceVariable"
	intervalVariable   variableKind = "IntervalVariable"
	customVariable     variableKind = "CustomVariable"
	groupByVariable    variableKind = "GroupByVariable"
	adhocVariable      variableKind = "AdhocVariable"
	switchVariable     variableKind = "SwitchVariable"
)

// sectionKind is the kind of the sections of a layout: the rows of a RowsLayout, or the tabs of a TabsLayout.
type sectionKind int

const (
	rowSection sectionKind = iota
	tabSection
)

type element struct {
	Kind elementKind     `json:"kind"`
	Spec json.RawMessage `json:"spec"`
}

// datasource is the reference to a datasource in the schema v2. Its name is the UID of the datasource.
type datasource struct {
	Name string `json:"name"`
}

// datasourceRef is the reference to a datasource in the classic JSON model.
type datasourceRef struct {
	Type string `json:"type,omitempty"`
	UID  string `json:"uid,omitempty"`
}

type dataQuery struct {
	// Group is the type of the datasource.
	Group      string                     `json:"group"`
	Datasource *datasource                `json:"datasource"`
	Spec       map[string]json.RawMessage `json:"spec"`
}

type transformation struct {
	Kind string `json:"kind"`
	// Group is the ID of the transformation. In v2beta1, the ID is the kind instead.
	Group string                     `json:"group"`
	Spec  map[string]json.RawMessage `json:"spec"`
}

type panelQuerySpec struct {
	Query  dataQuery `json:"query"`
	RefID  string    `json:"refId"`
	Hidden bool      `json:"hidden"`
}

type panelQuery struct {
	Spec panelQuerySpec `json:"spec"`
}

type queryGroupSpec struct {
	Queries         []panelQuery               `json:"queries"`
	Transformations []transformation           `json:"transformations"`
	QueryOptions    map[string]json.RawMessage `json:"queryOptions"`
}

type queryGroup struct {
	Spec queryGroupSpec `json:"spec"`
}

type vizConfigSpec struct {
	Options     json.RawMessage `json:"options"`
	FieldConfig json.RawMessage `json:"fieldConfig"`
}

type vizConfig struct {
	// Group is the type of the panel.
	Group   string        `json:"group"`
	Version string        `json:"version"`
	Spec    vizConfigSpec `json:"spec"`
}

type panelSpec struct {
	ID          json.RawMessage `json:"id"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Links       json.RawMessage `json:"links"`
	Transparent bool            `json:"transparent"`
	Data        queryGroup      `json:"data"`
	VizConfig   vizConfig       `json:"vizConfig"`
}

type variable struct {
	Kind variableKind `json:"kind"`
	// Group and Datasource are the datasource of the GroupByVariable and AdhocVariable.
	Group      string                     `json:"group"`
	Datasource *datasource                `json:"datasource"`
	Spec       map[string]json.RawMessage `json:"spec"`
}

type annotation struct {
	Spec map[string]json.RawMessage `json:"spec"`
}

type repeat struct {
	Value     string `json:"value"`
	Direction string `json:"direction"`
	MaxPerRow *int   `json:"maxPerRow"`
}

type elementReference struct {
	Name string `json:"name"`
}

type layoutItemSpec struct {
	X       int              `json:"x"`
	Y       int              `json:"y"`
	Width   int              `json:"width"`
	Height  int              `json:"height"`
	Element elementReference `json:"element"`
	Repeat  *repeat          `json:"repeat"`
}

type layoutItem struct {
	Spec layoutItemSpec `json:"spec"`
}

type sectionSpec struct {
	Title       string       `json:"title"`
	Collapse    bool         `json:"collapse"`
	HideHeader  bool         `json:"hideHeader"`
	Repeat      *repeat      `json:"repeat"`
	Layout      layout       `json:"layout"`
	Variables   []variable   `json:"variables"`
	Annotations []annotation `json:"annotations"`
}

// section is a row of a RowsLayout or a tab of a TabsLayout.
type section struct {
	Spec sectionSpec `json:"spec"`
}

type layoutSpec struct {
	// Items are the items of a GridLayout or of an AutoGridLayout.
	Items []layoutItem `json:"items"`
	// Rows are the rows of a RowsLayout.
	Rows []section `json:"rows"`
	// Tabs are the tabs of a TabsLayout.
	Tabs []section `json:"tabs"`
	// The fields below are the settings of an AutoGridLayout.
	MaxColumnCount float64 `json:"maxColumnCount"`
	RowHeightMode  string  `json:"rowHeightMode"`
	RowHeight      float64 `json:"rowHeight"`
}

type layout struct {
	Kind layoutKind `json:"kind"`
	Spec layoutSpec `json:"spec"`
}

type timeSettings struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Timezone    string `json:"timezone"`
	AutoRefresh string `json:"autoRefresh"`
}

type dashboardSpec struct {
	Title        string             `json:"title"`
	Description  string             `json:"description"`
	Tags         []string           `json:"tags"`
	Links        json.RawMessage    `json:"links"`
	TimeSettings timeSettings       `json:"timeSettings"`
	Annotations  []annotation       `json:"annotations"`
	Variables    []variable         `json:"variables"`
	Elements     map[string]element `json:"elements"`
	Layout       layout             `json:"layout"`
}

// gridPos is the position of a panel on the grid of the classic JSON model.
type gridPos struct {
	X int `json:"x"`
	Y int `json:"y"`
	W int `json:"w"`
	H int `json:"h"`
}
