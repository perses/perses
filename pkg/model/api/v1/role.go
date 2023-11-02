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

type RoleInterface interface {
	GetMetadata() modelAPI.Metadata
}

type ActionKind string

const (
	WildcardAction ActionKind = "*"
	ReadAction     ActionKind = "read"
	CreateAction   ActionKind = "create"
	UpdateAction   ActionKind = "update"
	DeleteAction   ActionKind = "delete"
)

type Permission struct {
	// Actions of the permission (read, create, update, delete, ...)
	Actions []ActionKind `json:"actions" yaml:"actions"`
	// The list of kind targeted by the permission. For example: `Datasource`, `Dashboard`, ...
	// With Role, you can't target global kinds
	Scopes []Kind `json:"scopes" yaml:"scopes"`
}

func (p *Permission) UnmarshalJSON(data []byte) error {
	var tmp Permission
	type plain Permission
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Permission) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Permission
	type plain Permission
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Permission) validate() error {
	if len(p.Actions) == 0 {
		return fmt.Errorf("permission actions cannot be empty")
	}
	if len(p.Scopes) == 0 {
		return fmt.Errorf("permission scopes cannot be empty")
	}
	return nil
}

type RoleSpec struct {
	// List of permissions owned by the role
	Permissions []Permission `json:"permissions" yaml:"permissions"`
}

// GlobalRole is the struct representing the role shared to everybody.
type GlobalRole struct {
	Kind     Kind     `json:"kind" yaml:"kind"`
	Metadata Metadata `json:"metadata" yaml:"metadata"`
	Spec     RoleSpec `json:"spec" yaml:"spec"`
}

func (g *GlobalRole) UnmarshalJSON(data []byte) error {
	var tmp GlobalRole
	type plain GlobalRole
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*g = tmp
	return nil
}

func (g *GlobalRole) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp GlobalRole
	type plain GlobalRole
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*g = tmp
	return nil
}

func (g *GlobalRole) validate() error {
	if g.Kind != KindGlobalRole {
		return fmt.Errorf("invalid kind: %q for a GlobalRole type", g.Kind)
	}
	if reflect.DeepEqual(g.Spec, RoleSpec{}) {
		return fmt.Errorf("spec cannot be empty")
	}
	return nil
}

func (g *GlobalRole) GetMetadata() modelAPI.Metadata {
	return &g.Metadata
}

func (g *GlobalRole) GetKind() string {
	return string(g.Kind)
}

func (g *GlobalRole) GetRoleSpec() RoleSpec {
	return g.Spec
}

func (g *GlobalRole) GetSpec() interface{} {
	return g.Spec
}

// Role will be the role you can define in your project/namespace
// This is a resource that won't be shared across projects.
type Role struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     RoleSpec        `json:"spec" yaml:"spec"`
}

func (r *Role) UnmarshalJSON(data []byte) error {
	var tmp Role
	type plain Role
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *Role) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Role
	type plain Role
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *Role) validate() error {
	if r.Kind != KindRole {
		return fmt.Errorf("invalid kind: %q for a Role type", r.Kind)
	}
	if reflect.DeepEqual(r.Spec, RoleSpec{}) {
		return fmt.Errorf("spec cannot be empty")
	}

	// Role can't have permissions targeting global resources
	for _, permission := range r.Spec.Permissions {
		for _, scope := range permission.Scopes {
			if IsGlobal(scope) {
				return fmt.Errorf("invalid scope: %q for a Role scope", scope)
			}
		}
	}
	return nil
}

func (r *Role) GetMetadata() modelAPI.Metadata {
	return &r.Metadata
}

func (r *Role) GetKind() string {
	return string(r.Kind)
}

func (r *Role) GetSpec() interface{} {
	return r.Spec
}
