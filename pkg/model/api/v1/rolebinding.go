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
	"slices"

	modelAPI "github.com/perses/perses/pkg/model/api"
)

// maxSubjectsForLinearDeduplication is the maximum number of subjects of a role binding for which the duplicated
// subjects are searched by scanning the subjects already kept, instead of using a map. For the common small role
// bindings, it is cheaper than allocating a map.
const maxSubjectsForLinearDeduplication = 16

type RoleBindingInterface interface {
	GetMetadata() modelAPI.Metadata
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

func (s *Subject) UnmarshalYAML(unmarshal func(any) error) error {
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
	Role string `json:"role" yaml:"role"`
	// Subjects that will inherit permissions from the role
	Subjects []Subject `json:"subjects" yaml:"subjects"`
}

func (r *RoleBindingSpec) Has(kind Kind, name string) bool {
	for _, sub := range r.Subjects {
		if sub.Kind == kind && sub.Name == name {
			return true
		}
	}
	return false
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
	tmp.removeDuplicatedSubjects()
	*r = tmp
	return nil
}

func (r *RoleBindingSpec) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp RoleBindingSpec
	type plain RoleBindingSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	tmp.removeDuplicatedSubjects()
	*r = tmp
	return nil
}

// removeDuplicatedSubjects removes the subjects listed several times, keeping the first occurrence of each subject
// and the order of the subjects.
// As every role binding is unmarshalled when it is created, updated or read from the database, it guarantees that
// a subject appears only once in a role binding: the authorization relies on it to grant the permissions of the role
// only once to each subject.
func (r *RoleBindingSpec) removeDuplicatedSubjects() {
	if len(r.Subjects) < 2 {
		return
	}
	// The subjects kept are written in the same backing array, at an index lower or equal to the one being read.
	subjects := r.Subjects[:0]
	if len(r.Subjects) <= maxSubjectsForLinearDeduplication {
		for _, subject := range r.Subjects {
			if !slices.Contains(subjects, subject) {
				subjects = append(subjects, subject)
			}
		}
	} else {
		seen := make(map[Subject]struct{}, len(r.Subjects))
		for _, subject := range r.Subjects {
			if _, duplicated := seen[subject]; duplicated {
				continue
			}
			seen[subject] = struct{}{}
			subjects = append(subjects, subject)
		}
	}
	// The duplicates have been overwritten in the same backing array: clear the remaining elements.
	clear(r.Subjects[len(subjects):])
	r.Subjects = subjects
}

func (r *RoleBindingSpec) validate() error {
	if len(r.Role) == 0 {
		return fmt.Errorf("rolebinding role cannot be empty")
	}
	if len(r.Subjects) == 0 {
		return fmt.Errorf("rolebinding subjects cannot be empty")
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

func (g *GlobalRoleBinding) UnmarshalYAML(unmarshal func(any) error) error {
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

func (g *GlobalRoleBinding) GetSpec() any {
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

func (r *RoleBinding) UnmarshalYAML(unmarshal func(any) error) error {
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

func (r *RoleBinding) GetSpec() any {
	return r.Spec
}
