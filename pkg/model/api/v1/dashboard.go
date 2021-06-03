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

type DashboardSection struct {
	// Order is used to know the display order
	Order uint64 `json:"order" yaml:"order"`
	// Open is used to know if the section is opened by default when the dashboard is loaded for the first time
	Open   bool              `json:"open" yaml:"open"`
	Panels map[string]*Panel `json:"panels" yaml:"panels"`
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
	// Datasource is the name of the datasource.
	// It's the direct reference of the document of type `Datasource`.
	// The datasource linked must exist in the database.
	Datasource string `json:"datasource" yaml:"datasource"`
	// Duration is the default time you would like to use to looking in the past when getting data to fill the
	// dashboard
	Duration  model.Duration                `json:"duration" yaml:"duration"`
	Variables map[string]*DashboardVariable `json:"variables,omitempty" yaml:"variables,omitempty"`
	Sections  map[string]*DashboardSection  `json:"sections" yaml:"sections"`
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
