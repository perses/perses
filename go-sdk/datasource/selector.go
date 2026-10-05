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
	"bytes"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// variableNameRegexp mirrors internal/api/validate.variableNameRegexp.
// It requires at least one non-digit word character, preventing collisions
// with PromQL's positional $1/$2 placeholder syntax.
var variableNameRegexp = regexp.MustCompile(`^\w*?[^0-9]\w*$`)

// StaticSelector identifies a concrete datasource by kind and name.
type StaticSelector struct {
	Kind string `json:"kind" yaml:"kind"`
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
}

// VariableSelector identifies a datasource via a Perses variable reference.
// Name holds the bare variable name without the leading "$".
type VariableSelector struct {
	Name string
}

// Selector identifies a datasource either by a concrete static reference or
// by a Perses variable reference. Exactly one of Static or Variable must be set.
//
// A variable selector serializes as a plain JSON/YAML string (e.g. "$myDatasource"),
// which Perses resolves at runtime. A static selector serializes as a structured
// object {"kind":"...","name":"..."}.
type Selector struct {
	Static   *StaticSelector
	Variable *VariableSelector
}

// NewStaticSelector returns a Selector for a concrete, named datasource.
func NewStaticSelector(kind, name string) *Selector {
	return &Selector{Static: &StaticSelector{Kind: kind, Name: name}}
}

// NewVariableSelector returns a Selector for a Perses variable reference.
// name may be "foo", "$foo", or "${foo}"; Variable.Name stores the bare name without "$".
// Returns an error if the name is not a valid Perses variable name.
func NewVariableSelector(name string) (*Selector, error) {
	bare := normalizeName(name)
	if !variableNameRegexp.MatchString(bare) {
		return nil, fmt.Errorf("invalid variable name %q: must contain at least one non-digit word character", bare)
	}
	return &Selector{Variable: &VariableSelector{Name: bare}}, nil
}

func (s Selector) MarshalJSON() ([]byte, error) {
	if s.Variable != nil && s.Static == nil {
		if !variableNameRegexp.MatchString(s.Variable.Name) {
			return nil, fmt.Errorf("invalid variable reference %q: name must contain at least one non-digit word character", s.Variable.Name)
		}
		return json.Marshal("$" + s.Variable.Name)
	}
	if s.Static != nil && s.Variable == nil {
		return json.Marshal(s.Static)
	}
	return nil, fmt.Errorf("datasource.Selector must have exactly one of Static or Variable set")
}

func (s *Selector) UnmarshalJSON(data []byte) error {
	*s = Selector{}
	if bytes.Equal(bytes.TrimSpace(data), []byte("null")) {
		return nil
	}
	var str string
	if json.Unmarshal(data, &str) == nil {
		if !strings.HasPrefix(str, "$") {
			return fmt.Errorf("invalid variable reference %q: string selectors must start with \"$\"", str)
		}
		bare := normalizeName(str)
		if !variableNameRegexp.MatchString(bare) {
			return fmt.Errorf("invalid variable reference %q: name must contain at least one non-digit word character", str)
		}
		s.Variable = &VariableSelector{Name: bare}
		return nil
	}
	var static StaticSelector
	if err := json.Unmarshal(data, &static); err != nil {
		return err
	}
	s.Static = &static
	return nil
}

func (s Selector) MarshalYAML() (interface{}, error) {
	if s.Variable != nil && s.Static == nil {
		if !variableNameRegexp.MatchString(s.Variable.Name) {
			return nil, fmt.Errorf("invalid variable reference %q: name must contain at least one non-digit word character", s.Variable.Name)
		}
		return "$" + s.Variable.Name, nil
	}
	if s.Static != nil && s.Variable == nil {
		return s.Static, nil
	}
	return nil, fmt.Errorf("datasource.Selector must have exactly one of Static or Variable set")
}

func (s *Selector) UnmarshalYAML(value *yaml.Node) error {
	*s = Selector{}
	if value.Kind == yaml.ScalarNode {
		if value.Tag == "!!null" {
			return nil
		}
		if value.Tag != "!!str" {
			return fmt.Errorf("datasource selector must be a string or a mapping, got %s", value.Tag)
		}
		if !strings.HasPrefix(value.Value, "$") {
			return fmt.Errorf("invalid variable reference %q: string selectors must start with \"$\"", value.Value)
		}
		bare := normalizeName(value.Value)
		if !variableNameRegexp.MatchString(bare) {
			return fmt.Errorf("invalid variable reference %q: name must contain at least one non-digit word character", value.Value)
		}
		s.Variable = &VariableSelector{Name: bare}
		return nil
	}
	var static StaticSelector
	if err := value.Decode(&static); err != nil {
		return err
	}
	s.Static = &static
	return nil
}

// normalizeName strips a leading "$" or "${...}" wrapper to return the bare variable name.
func normalizeName(name string) string {
	if strings.HasPrefix(name, "${") && strings.HasSuffix(name, "}") {
		return name[2 : len(name)-1]
	}
	return strings.TrimPrefix(name, "$")
}
