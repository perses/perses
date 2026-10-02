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

package datasource

import (
	"encoding/json"
	"strings"
)

type Selector struct {
	Kind string `json:"kind" yaml:"kind"`
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
}

// MarshalJSON emits a plain JSON string when Name starts with "$" (variable
// reference), and the standard object form otherwise.
func (s Selector) MarshalJSON() ([]byte, error) {
	if strings.HasPrefix(s.Name, "$") {
		return json.Marshal(s.Name)
	}
	type plain Selector
	return json.Marshal(plain(s))
}

// UnmarshalJSON handles both the plain-string form ("$myVar") and the
// structured-object form ({"kind":"…","name":"…"}).
func (s *Selector) UnmarshalJSON(data []byte) error {
	var str string
	if json.Unmarshal(data, &str) == nil {
		s.Name = str
		return nil
	}
	type plain Selector
	return json.Unmarshal(data, (*plain)(s))
}
