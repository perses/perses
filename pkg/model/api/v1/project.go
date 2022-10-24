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
)

func GenerateProjectID(name string) string {
	return fmt.Sprintf("/projects/%s", name)
}

type ProjectSpec struct {
}

type Project struct {
	Kind     Kind        `json:"kind" yaml:"kind"`
	Metadata Metadata    `json:"metadata" yaml:"metadata"`
	Spec     ProjectSpec `json:"spec,omitempty" yaml:"spec,omitempty"`
}

func (p *Project) GenerateID() string {
	return GenerateProjectID(p.Metadata.Name)
}

func (p *Project) GetMetadata() modelAPI.Metadata {
	return &p.Metadata
}

func (p *Project) GetKind() string {
	return string(p.Kind)
}

func (p *Project) GetSpec() interface{} {
	return p.Spec
}

func (p *Project) UnmarshalJSON(data []byte) error {
	var tmp Project
	type plain Project
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Project) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Project
	type plain Project
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Project) validate() error {
	if p.Kind != KindProject {
		return fmt.Errorf("invalid kind: %q for a Project type", p.Kind)
	}
	return nil
}
