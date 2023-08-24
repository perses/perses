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

package secret

import "encoding/json"

const secretToken = "<secret>"

// Hidden special type for storing secrets.
type Hidden string

// MarshalYAML implements the yaml.Marshaler interface for Hidden.
func (h Hidden) MarshalYAML() (interface{}, error) {
	if h != "" {
		return secretToken, nil
	}
	return nil, nil
}

// UnmarshalYAML implements the yaml.Unmarshaler interface for Hidden.
func (h *Hidden) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type plain Hidden
	return unmarshal((*plain)(h))
}

// MarshalJSON implements the json.Marshaler interface for Secret.
func (h Hidden) MarshalJSON() ([]byte, error) {
	if len(h) == 0 {
		return json.Marshal("")
	}
	return json.Marshal(secretToken)
}
