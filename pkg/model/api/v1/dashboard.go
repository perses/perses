// Copyright 2021 The Perses Authors
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

package v1

import (
	"encoding/json"
	"fmt"
	"reflect"

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/prometheus/common/model"
)

type Link struct {
	Name            string `json:"name,omitempty" yaml:"name,omitempty"`
	URL             string `json:"url" yaml:"url"`
	Tooltip         string `json:"tooltip,omitempty" yaml:"tooltip,omitempty"`
	RenderVariables bool   `json:"renderVariables,omitempty" yaml:"renderVariables,omitempty"`
	TargetBlank     bool   `json:"targetBlank,omitempty" yaml:"targetBlank,omitempty"`
}

type PanelDisplay struct {
	Name        string `json:"name" yaml:"name"`
	Description string `json:"description,omitempty" yaml:"description,omitempty"`
}

func (p *PanelDisplay) UnmarshalJSON(data []byte) error {
	var tmp PanelDisplay
	type plain PanelDisplay
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PanelDisplay) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PanelDisplay
	type plain PanelDisplay
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PanelDisplay) validate() error {
	if len(p.Name) == 0 {
		return fmt.Errorf("display.name cannot be empty")
	}
	return nil
}

type PanelSpec struct {
	Display PanelDisplay  `json:"display" yaml:"display"`
	Plugin  common.Plugin `json:"plugin" yaml:"plugin"`
	Queries []Query       `json:"queries,omitempty" yaml:"queries,omitempty"`
	Links   []Link        `json:"links,omitempty" yaml:"links,omitempty"`
}

type Panel struct {
	Kind string    `json:"kind" yaml:"kind"`
	Spec PanelSpec `json:"spec" yaml:"spec"`
}

type Query struct {
	Kind string    `json:"kind" yaml:"kind"`
	Spec QuerySpec `json:"spec" yaml:"spec"`
}

type QuerySpec struct {
	Plugin common.Plugin `json:"plugin" yaml:"plugin"`
}

type DashboardSpec struct {
	Display *common.Display `json:"display,omitempty" yaml:"display,omitempty"`
	// Datasources is an optional list of datasource definition.
	Datasources map[string]*DatasourceSpec `json:"datasources,omitempty" yaml:"datasources,omitempty"`
	Variables   []dashboard.Variable       `json:"variables,omitempty" yaml:"variables,omitempty"`
	Panels      map[string]*Panel          `json:"panels" yaml:"panels"`
	Layouts     []dashboard.Layout         `json:"layouts" yaml:"layouts"`
	// Duration is the default time range to use when getting data to fill the dashboard
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=duration
	Duration model.Duration `json:"duration" yaml:"duration"`
	// RefreshInterval is the default refresh interval to use when landing on the dashboard
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=duration
	RefreshInterval model.Duration `json:"refreshInterval,omitempty" yaml:"refreshInterval,omitempty"`
}

func (d *DashboardSpec) UnmarshalJSON(data []byte) error {
	var tmp DashboardSpec
	type plain DashboardSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DashboardSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp DashboardSpec
	type plain DashboardSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DashboardSpec) validate() error {
	variables := make(map[string]bool, len(d.Variables))
	for i, variable := range d.Variables {
		name := variable.Spec.GetName()
		if !variables[name] {
			variables[name] = true
		} else {
			return fmt.Errorf("variable %q (index %d) already exists", name, i)
		}
	}
	for panelKey := range d.Panels {
		if err := common.ValidateID(panelKey); err != nil {
			return err
		}
	}
	return nil
}

type Dashboard struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     DashboardSpec   `json:"spec" yaml:"spec"`
}

func (d *Dashboard) GetMetadata() modelAPI.Metadata {
	return &d.Metadata
}

func (d *Dashboard) GetKind() string {
	return string(d.Kind)
}

func (d *Dashboard) GetSpec() interface{} {
	return d.Spec
}

func (d *Dashboard) UnmarshalJSON(data []byte) error {
	var tmp Dashboard
	type plain Dashboard
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *Dashboard) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Dashboard
	type plain Dashboard
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *Dashboard) validate() error {
	if d.Kind != KindDashboard {
		return fmt.Errorf("invalid kind: %q for a Dashboard type", d.Kind)
	}
	if reflect.DeepEqual(d.Spec, DashboardSpec{}) {
		return fmt.Errorf("spec cannot be empty")
	}
	return verifyAndSetJSONReferences(d.Spec.Layouts, d.Spec.Panels)
}

// verifyAndSetJSONRef will check that each JSON Reference are pointing to an existing object and will set the related pointer in the JSONRef.Object
func verifyAndSetJSONReferences(layouts []dashboard.Layout, panels map[string]*Panel) error {
	for _, layout := range layouts {
		switch spec := layout.Spec.(type) {
		case *dashboard.GridLayoutSpec:
			for _, item := range spec.Items {
				if err := checkAndSetRef(item.Content, panels); err != nil {
					return err
				}
			}

		}
	}
	return nil
}

func checkAndSetRef(ref *common.JSONRef, panels map[string]*Panel) error {
	// ref.Path should be like [ "spec", "panels", <name> ]
	var panelsRefPath = []string{"spec", "panels"}

	if len(ref.Path) != len(panelsRefPath)+1 {
		return fmt.Errorf("reference %q is pointing to the void", ref.Ref)
	}
	for i := range panelsRefPath {
		if ref.Path[i] != panelsRefPath[i] {
			return fmt.Errorf("reference %q at position %d doesn't have the expected element \"%s\"", ref.Ref, i, panelsRefPath[i])
		}
	}
	obj, ok := panels[ref.Path[len(panelsRefPath)]]
	if !ok {
		return fmt.Errorf("no panel found for ref %q", ref.Path[2])
	}
	ref.Object = obj

	return nil
}
