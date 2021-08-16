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
	"regexp"

	"github.com/prometheus/common/model"
)

var keyRegexp = regexp.MustCompile("(?m)^[a-zA-Z0-9_-]")

func GenerateDashboardID(project string, name string) string {
	return generateProjectResourceID("dashboards", project, name)
}

type DashboardSpec struct {
	// Datasource is the name of the datasource.
	// It's the direct reference of the document of type `Datasource`.
	// The datasource linked must exist in the database.
	Datasource string `json:"datasource" yaml:"datasource"`
	// Duration is the default time you would like to use to looking in the past when getting data to fill the
	// dashboard
	Duration   model.Duration                `json:"duration" yaml:"duration"`
	Variables  map[string]*DashboardVariable `json:"variables,omitempty" yaml:"variables,omitempty"`
	Panels     map[string]*DashboardPanel    `json:"panels" yaml:"panels"`
	Layouts    map[string]*DashboardLayout   `json:"layouts" yaml:"layouts"`
	Entrypoint *JSONRef                      `json:"entrypoint" yaml:"entrypoint"`
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
	if len(d.Datasource) == 0 {
		return fmt.Errorf("dashboard.spec.datasource cannot be empty")
	}
	if len(d.Panels) == 0 {
		return fmt.Errorf("dashboard.spec.panels cannot be empty")
	}
	for variableKey := range d.Variables {
		if len(keyRegexp.FindAllString(variableKey, -1)) <= 0 {
			return fmt.Errorf("variable reference '%s' is containing spaces or special characters", variableKey)
		}
	}
	for panelKey := range d.Panels {
		if len(keyRegexp.FindAllString(panelKey, -1)) <= 0 {
			return fmt.Errorf("panel reference '%s' is containing spaces or special characters", panelKey)
		}
	}
	if d.Entrypoint == nil {
		return fmt.Errorf("dashboard.entrypoint cannot be empty")
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

func (d *Dashboard) GetMetadata() interface{} {
	return &d.Metadata
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
		return fmt.Errorf("invalid kind: '%s' for a Dashboard type", d.Kind)
	}
	return d.verifyAndSetJSONReferences()
}

// verifyAndSetJSONRef will check that each JSON Reference are pointing to an existing object and will set the related pointer in the JSONRef.Object
func (d *Dashboard) verifyAndSetJSONReferences() error {
	for _, layout := range d.Spec.Layouts {
		switch parameter := layout.Parameter.(type) {
		case *GridLayoutParameter:
			for _, line := range parameter.Children {
				for _, cell := range line {
					if cell.Content != nil {
						if err := d.checkAndSetRef(cell.Content); err != nil {
							return err
						}
					}
				}
			}
		case *ExpandLayoutParameter:
			for _, ref := range parameter.Children {
				if err := d.checkAndSetRef(ref); err != nil {
					return err
				}
			}
		}
	}
	return d.checkAndSetRef(d.Spec.Entrypoint)
}

func (d *Dashboard) checkAndSetRef(ref *JSONRef) error {
	// ref.Path should like that [ "spec", "layouts" | "panels", <name> ].
	// So if the array is not equal to three then the reference is wrong.
	if len(ref.Path) != 3 {
		return fmt.Errorf("reference '%s' is pointing to the void", ref.Ref)
	}
	if ref.Path[0] != "spec" {
		return fmt.Errorf("reference '%s' doesn't start by 'spec'", ref.Ref)
	}
	switch ref.Path[1] {
	case "layouts":
		if obj, ok := d.Spec.Layouts[ref.Path[2]]; !ok {
			return fmt.Errorf("there is no existing layout called '%s' in the current dashboard", ref.Path[2])
		} else {
			ref.Object = obj
		}
	case "panels":
		if obj, ok := d.Spec.Panels[ref.Path[2]]; !ok {
			return fmt.Errorf("there is no existing panel called '%s' in the current dashboard", ref.Path[2])
		} else {
			ref.Object = obj
		}
	default:
		return fmt.Errorf("'%s' is not a known object", ref.Path[1])
	}
	return nil
}
