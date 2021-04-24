// Copyright 2021 Amadeus s.a.s
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

	"github.com/prometheus/common/model"
)

func GenerateDashboardID(project string, name string) string {
	return generateProjectResourceID("dashboards", project, name)
}

type DashboardVariable struct {
	Name string `json:"name" yaml:"name"`
	Expr string `json:"expr" yaml:"expr"`
	// Selected is the variable selected by default if it exists
	Selected string `json:"selected,omitempty" yaml:"selected,omitempty"`
}

func (d *DashboardVariable) UnmarshalJSON(data []byte) error {
	var tmp DashboardVariable
	type plain DashboardVariable
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DashboardVariable) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp DashboardVariable
	type plain DashboardVariable
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DashboardVariable) validate() error {
	if len(d.Name) == 0 {
		return fmt.Errorf("variable.name cannot be empty")
	}
	if len(d.Expr) == 0 {
		return fmt.Errorf("variable.expr cannot be empty")
	}
	return nil
}

type DashboardSection struct {
	// Name is the name of the section. It is optional
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
	// Order is used to know the display order
	Order uint64 `json:"order" yaml:"order"`
	// Open is used to know if the section is opened by default when the dashboard is loaded for the first time
	Open   bool    `json:"open" yaml:"open"`
	Panels []Panel `json:"panels" yaml:"panels"`
}

func (d *DashboardSection) UnmarshalJSON(data []byte) error {
	var tmp DashboardSection
	type plain DashboardSection
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DashboardSection) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp DashboardSection
	type plain DashboardSection
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *DashboardSection) validate() error {
	if len(d.Panels) == 0 {
		return fmt.Errorf("sections[].panels cannot be empty")
	}
	return nil
}

type DashboardSpec struct {
	Datasource string              `json:"datasource" yaml:"datasource"`
	Duration   model.Duration      `json:"duration" yaml:"duration"`
	Variables  []DashboardVariable `json:"variables,omitempty" yaml:"variables,omitempty"`
	Sections   []DashboardSection  `json:"sections" yaml:"sections"`
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
	if len(d.Sections) == 0 {
		return fmt.Errorf("dashboard.spec.sections cannot be empty")
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
	return nil
}
