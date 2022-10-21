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

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/prometheus/common/model"
)

func GenerateDashboardID(project string, name string) string {
	return generateProjectResourceID("dashboards", project, name)
}

type PanelSpec struct {
	Display *common.Display `json:"display,omitempty" yaml:"display,omitempty"`
	Plugin  common.Plugin   `json:"plugin" yaml:"plugin"`
}

type Panel struct {
	Kind string    `json:"kind" yaml:"kind"`
	Spec PanelSpec `json:"spec" yaml:"spec"`
}

type DashboardSpec struct {
	// Datasource is a set of values that will be used to find the datasource definition.
	Datasource dashboard.Datasource `json:"datasource" yaml:"datasource"`
	// Duration is the default time you would like to use to looking in the past when getting data to fill the
	// dashboard
	Duration  model.Duration       `json:"duration" yaml:"duration"`
	Variables []dashboard.Variable `json:"variables,omitempty" yaml:"variables,omitempty"`
	Panels    map[string]*Panel    `json:"panels" yaml:"panels"` // kept as raw json as the validation is done with cuelang
	Layouts   []dashboard.Layout   `json:"layouts" yaml:"layouts"`
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
	if len(d.Panels) == 0 {
		return fmt.Errorf("dashboard.spec.panels cannot be empty")
	}
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

func (d *Dashboard) GenerateID() string {
	return GenerateDashboardID(d.Metadata.Project, d.Metadata.Name)
}

func (d *Dashboard) GetMetadata() modelAPI.Metadata {
	return &d.Metadata
}

func (d *Dashboard) GetKind() string {
	return string(d.Kind)
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
	return d.verifyAndSetJSONReferences()
}

// verifyAndSetJSONRef will check that each JSON Reference are pointing to an existing object and will set the related pointer in the JSONRef.Object
func (d *Dashboard) verifyAndSetJSONReferences() error {
	for _, layout := range d.Spec.Layouts {
		switch spec := layout.Spec.(type) {
		case *dashboard.GridLayoutSpec:
			for _, item := range spec.Items {
				if err := d.checkAndSetRef(item.Content); err != nil {
					return err
				}
			}

		}
	}
	return nil
}

func (d *Dashboard) checkAndSetRef(ref *common.JSONRef) error {
	// ref.Path should like that [ "spec", "panels", <name> ].
	// So if the array is not equal to three then the reference is wrong.
	if len(ref.Path) != 3 {
		return fmt.Errorf("reference %q is pointing to the void", ref.Ref)
	}
	if ref.Path[0] != "spec" {
		return fmt.Errorf("reference %q doesn't start by 'spec'", ref.Ref)
	}
	switch ref.Path[1] {
	case "panels":
		obj, ok := d.Spec.Panels[ref.Path[2]]
		if !ok {
			return fmt.Errorf("there is no existing panel called %q in the current dashboard", ref.Path[2])
		}
		ref.Object = obj
	default:
		return fmt.Errorf("%q is not a known object", ref.Path[1])
	}
	return nil
}
