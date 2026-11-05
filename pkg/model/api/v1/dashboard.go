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

package v1

import (
	"encoding/json"
	"fmt"
	"reflect"

	modelAPI "github.com/perses/perses/pkg/model/api"
	commonSpec "github.com/perses/spec/go/common"
	dashboardSpec "github.com/perses/spec/go/dashboard"
)

type Dashboard struct {
	Kind     Kind               `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata    `json:"metadata" yaml:"metadata"`
	Spec     dashboardSpec.Spec `json:"spec" yaml:"spec"`
}

func (d *Dashboard) GetMetadata() modelAPI.Metadata {
	return &d.Metadata
}

func (d *Dashboard) GetKind() string {
	return string(d.Kind)
}

func (d *Dashboard) GetSpec() any {
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

func (d *Dashboard) UnmarshalYAML(unmarshal func(any) error) error {
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
	if reflect.DeepEqual(d.Spec, dashboardSpec.Spec{}) {
		return fmt.Errorf("spec cannot be empty")
	}
	return verifyAndSetJSONReferences(d.Spec.Layouts, d.Spec.Panels)
}

// verifyAndSetJSONRef will check that each JSON Reference are pointing to an existing object and will set the related pointer in the JSONRef.Object
func verifyAndSetJSONReferences(layouts []dashboardSpec.Layout, panels map[string]*dashboardSpec.Panel) error {
	for _, layout := range layouts {
		switch spec := layout.Spec.(type) {
		case *dashboardSpec.GridLayoutSpec:
			for _, item := range spec.Items {
				if err := checkAndSetRef(item.Content, panels); err != nil {
					return err
				}
			}

		}
	}
	return nil
}

func checkAndSetRef(ref *commonSpec.JSONRef, panels map[string]*dashboardSpec.Panel) error {
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
