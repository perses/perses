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

package v1

import (
	"encoding/json"
	"fmt"
	"reflect"

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/prometheus/common/model"
)

type EphemeralDashboardSpecBase struct {
	TTL model.Duration `json:"ttl" yaml:"ttl"`
}

func (edsb *EphemeralDashboardSpecBase) UnmarshalJSON(data []byte) error {
	var tmp EphemeralDashboardSpecBase
	type plain EphemeralDashboardSpecBase
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	*edsb = tmp
	return nil
}

func (edsb *EphemeralDashboardSpecBase) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp EphemeralDashboardSpecBase
	type plain EphemeralDashboardSpecBase
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	*edsb = tmp
	return nil
}

type EphemeralDashboardSpec struct {
	EphemeralDashboardSpecBase
	DashboardSpec
}

// NB custom unmarshalling is required, otherwise by default the TTL field
// wont get unmarshalled because of the embedded struct taking precedence

func (eds *EphemeralDashboardSpec) UnmarshalJSON(data []byte) error {
	// Call UnmarshalJSON methods of the embedded structs
	var ephemeralDashboardSpecBaseTmp EphemeralDashboardSpecBase
	if err := ephemeralDashboardSpecBaseTmp.UnmarshalJSON(data); err != nil {
		return err
	}

	var dashboardSpecTmp DashboardSpec
	if err := dashboardSpecTmp.UnmarshalJSON(data); err != nil {
		return err
	}

	// Copy values to the fields of EphemeralDashboardSpec
	eds.EphemeralDashboardSpecBase = ephemeralDashboardSpecBaseTmp
	eds.DashboardSpec = dashboardSpecTmp

	return nil
}

func (eds *EphemeralDashboardSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	// Call UnmarshalYAML methods of the embedded structs
	var ephemeralDashboardSpecBaseTmp EphemeralDashboardSpecBase
	if err := ephemeralDashboardSpecBaseTmp.UnmarshalYAML(unmarshal); err != nil {
		return err
	}

	var dashboardSpecTmp DashboardSpec
	if err := dashboardSpecTmp.UnmarshalYAML(unmarshal); err != nil {
		return err
	}

	// Copy values to the fields of EphemeralDashboardSpec
	eds.EphemeralDashboardSpecBase = ephemeralDashboardSpecBaseTmp
	eds.DashboardSpec = dashboardSpecTmp

	return nil
}

type EphemeralDashboard struct {
	Kind     Kind                   `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata        `json:"metadata" yaml:"metadata"`
	Spec     EphemeralDashboardSpec `json:"spec" yaml:"spec"`
}

func (e *EphemeralDashboard) GetMetadata() modelAPI.Metadata {
	return &e.Metadata
}

func (e *EphemeralDashboard) GetKind() string {
	return string(e.Kind)
}

func (e *EphemeralDashboard) GetSpec() interface{} {
	return e.Spec
}

func (e *EphemeralDashboard) UnmarshalJSON(data []byte) error {
	var tmp EphemeralDashboard
	type plain EphemeralDashboard
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*e = tmp
	return nil
}

func (e *EphemeralDashboard) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp EphemeralDashboard
	type plain EphemeralDashboard
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*e = tmp
	return nil
}

func (e *EphemeralDashboard) validate() error {
	if e.Kind != KindEphemeralDashboard {
		return fmt.Errorf("invalid kind: %q for an EphemeralDashboard type", e.Kind)
	}
	if reflect.DeepEqual(e.Spec, EphemeralDashboardSpec{}) {
		return fmt.Errorf("spec cannot be empty")
	}
	return verifyAndSetJSONReferences(e.Spec.Layouts, e.Spec.Panels)
}
