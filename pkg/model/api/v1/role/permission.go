// Copyright 2023 The Perses Authors
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

package role

import (
	"encoding/json"
	"fmt"
)

type Permission struct {
	// Actions of the permission (read, create, update, delete, ...)
	Actions []Action `json:"actions" yaml:"actions"`
	// The list of kind targeted by the permission. For example: `Datasource`, `Dashboard`, ...
	// With Role, you can't target global kinds
	Scopes []Scope `json:"scopes" yaml:"scopes"`
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
