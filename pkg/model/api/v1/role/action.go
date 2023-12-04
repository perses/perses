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
	"strings"
)

type Action string

const (
	ReadAction     Action = "read"
	CreateAction   Action = "create"
	UpdateAction   Action = "update"
	DeleteAction   Action = "delete"
	WildcardAction Action = "*"
)

func (k *Action) UnmarshalJSON(data []byte) error {
	var tmp Action
	type plain Action
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Action) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Action
	type plain Action
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Action) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("kind cannot be empty")
	}
	if _, err := GetAction(string(*k)); err != nil {
		return err
	}
	return nil
}

// GetAction parse string to Action (not case-sensitive)
func GetAction(action string) (*Action, error) {
	switch strings.ToLower(action) {
	case strings.ToLower(string(ReadAction)):
		result := ReadAction
		return &result, nil
	case strings.ToLower(string(CreateAction)):
		result := CreateAction
		return &result, nil
	case strings.ToLower(string(UpdateAction)):
		result := UpdateAction
		return &result, nil
	case strings.ToLower(string(DeleteAction)):
		result := DeleteAction
		return &result, nil
	case strings.ToLower(string(WildcardAction)):
		result := WildcardAction
		return &result, nil
	default:
		return nil, fmt.Errorf("%q has no associated struct", action)
	}
}
