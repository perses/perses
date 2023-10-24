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
)

type RoleBindingInterface interface {
	GetMetadata() modelAPI.Metadata
	GetRoleBindingSpec() RoleBindingSpec
}

type Subject struct {
	Kind Kind   `json:"kind" yaml:"kind"`
	Name string `json:"name" yaml:"name"`
}

func (s *Subject) UnmarshalJSON(data []byte) error {
	var tmp Subject
	type plain Subject
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *Subject) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Subject
	type plain Subject
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *Subject) validate() error {
	if s.Kind != KindUser {
		return fmt.Errorf("invalid kind: %q for a Subject kind", s.Kind)
	}
	if len(s.Name) == 0 {
		return fmt.Errorf("subject name cannot be empty")
	}
	return nil
}

type RoleBindingSpec struct {
	// Name of the Role or GlobalRole concerned by the role binding (metadata.name)
	Role string `json:"name" yaml:"name"`
	// Subjects that will inherit permissions from the role
	Subjects []Subject `json:"subjects" yaml:"subjects"`
}

func (r *RoleBindingSpec) UnmarshalJSON(data []byte) error {
	var tmp RoleBindingSpec
	type plain RoleBindingSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *RoleBindingSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp RoleBindingSpec
	type plain RoleBindingSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *RoleBindingSpec) validate() error {
	if len(r.Role) == 0 {
		return fmt.Errorf("spec cannot be empty")
	}
	return nil
}

// GlobalRoleBinding is the struct representing the roleBinding shared to everybody.
type GlobalRoleBinding struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata Metadata        `json:"metadata" yaml:"metadata"`
	Spec     RoleBindingSpec `json:"spec" yaml:"spec"`
}

func (g *GlobalRoleBinding) UnmarshalJSON(data []byte) error {
	var tmp GlobalRoleBinding
	type plain GlobalRoleBinding
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*g = tmp
	return nil
}

func (g *GlobalRoleBinding) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp GlobalRoleBinding
	type plain GlobalRoleBinding
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*g = tmp
	return nil
}

func (g *GlobalRoleBinding) validate() error {
	if g.Kind != KindGlobalRoleBinding {
		return fmt.Errorf("invalid kind: %q for a GlobalRoleBinding type", g.Kind)
	}
	if reflect.DeepEqual(g.Spec, RoleBindingSpec{}) {
		return fmt.Errorf("spec cannot be empty")
	}
	return nil
}

func (g *GlobalRoleBinding) GetMetadata() modelAPI.Metadata {
	return &g.Metadata
}

func (g *GlobalRoleBinding) GetKind() string {
	return string(g.Kind)
}

func (g *GlobalRoleBinding) GetRoleBindingSpec() RoleBindingSpec {
	return g.Spec
}

func (g *GlobalRoleBinding) GetSpec() interface{} {
	return g.Spec
}

// RoleBinding will be the roleBinding you can define in your project/namespace
// This is a resource that won't be shared across projects.
type RoleBinding struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     RoleBindingSpec `json:"spec" yaml:"spec"`
}

func (r *RoleBinding) UnmarshalJSON(data []byte) error {
	var tmp RoleBinding
	type plain RoleBinding
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *RoleBinding) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp RoleBinding
	type plain RoleBinding
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *RoleBinding) validate() error {
	if r.Kind != KindRoleBinding {
		return fmt.Errorf("invalid kind: %q for a RoleBinding type", r.Kind)
	}
	if reflect.DeepEqual(r.Spec, RoleBindingSpec{}) {
		return fmt.Errorf("spec cannot be empty")
	}
	return nil
}

func (r *RoleBinding) GetMetadata() modelAPI.Metadata {
	return &r.Metadata
}

func (r *RoleBinding) GetKind() string {
	return string(r.Kind)
}

func (r *RoleBinding) GetRoleBindingSpec() RoleBindingSpec {
	return r.Spec
}

func (r *RoleBinding) GetSpec() interface{} {
	return r.Spec
}
