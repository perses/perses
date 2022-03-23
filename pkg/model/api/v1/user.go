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

func GenerateUserID(name string) string {
	return fmt.Sprintf("/users/%s", name)
}

type UserSpec struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Password  []byte `json:"password,omitempty"`
}

func (p *UserSpec) UnmarshalJSON(data []byte) error {
	type plain = struct {
		FirstName string `json:"first_name,omitempty" yaml:"first_name,omitempty"`
		LastName  string `json:"last_name,omitempty" yaml:"last_name,omitempty"`
		Password  string `json:"password,omitempty" yaml:"password,omitempty"`
	}
	var tmp plain
	if err := json.Unmarshal(data, &tmp); err != nil {
		return err
	}
	if len(tmp.Password) > 0 {
		p.Password = []byte(tmp.Password)
	}
	p.LastName = tmp.LastName
	p.FirstName = tmp.FirstName
	return nil
}

func (p *UserSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type plain = struct {
		FirstName string `json:"first_name,omitempty" yaml:"first_name,omitempty"`
		LastName  string `json:"last_name,omitempty" yaml:"last_name,omitempty"`
		Password  string `json:"password,omitempty" yaml:"password,omitempty"`
	}
	var tmp plain
	if err := unmarshal(&tmp); err != nil {
		return err
	}
	if len(tmp.Password) > 0 {
		p.Password = []byte(tmp.Password)
	}
	p.LastName = tmp.LastName
	p.FirstName = tmp.FirstName
	return nil
}

type User struct {
	Kind     Kind     `json:"kind" yaml:"kind"`
	Metadata Metadata `json:"metadata" yaml:"metadata"`
	Spec     UserSpec `json:"spec" yaml:"spec"`
}

func (p *User) GenerateID() string {
	return GenerateUserID(p.Metadata.Name)
}

func (p *User) GetMetadata() modelAPI.Metadata {
	return &p.Metadata
}

func (p *User) GetKind() string {
	return string(p.Kind)
}

func (p *User) UnmarshalJSON(data []byte) error {
	var tmp User
	type plain User
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *User) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp User
	type plain User
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *User) validate() error {
	if p.Kind != KindUser {
		return fmt.Errorf("invalid kind: %q for a User type", p.Kind)
	}
	return nil
}
