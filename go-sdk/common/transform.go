// Copyright 2024 The Perses Authors
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

package common

import (
	"encoding/json"
	"fmt"

	"gopkg.in/yaml.v3"
)

type TransformKind = string

const (
	JoinByColumValueKind    TransformKind = "JoinByColumnValue"
	MergeByColumnsKind      TransformKind = "MergeColumns"
	MergeIndexedColumnsKind TransformKind = "MergeIndexedColumns"
	MergeSeriesKind         TransformKind = "MergeSeries"
)

type JoinByColumnValueSpec struct {
	Columns  []string `json:"columns" yaml:"columns"`
	Disabled bool     `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

type MergeColumnsSpec struct {
	Columns  []string `json:"columns" yaml:"columns"`
	Name     string   `json:"name" yaml:"name"`
	Disabled bool     `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

type MergeIndexedColumnsSpec struct {
	Column   string `json:"column" yaml:"column"`
	Disabled bool   `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

type MergeSeriesSpec struct {
	Disabled bool `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

type Transform struct {
	Kind TransformKind `json:"kind" yaml:"kind"`
	Spec any           `json:"spec" yaml:"spec"`
}

func (t *Transform) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(variable any) error {
		return json.Unmarshal(data, variable)
	}
	return t.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (t *Transform) UnmarshalYAML(unmarshal func(any) error) error {
	return t.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (t *Transform) unmarshal(unmarshal func(any) error, staticMarshal func(any) ([]byte, error), staticUnmarshal func([]byte, any) error) error {
	var tmp Transform
	type plain Transform
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	rawSpec, err := staticMarshal(tmp.Spec)
	if err != nil {
		return err
	}
	var spec any
	switch tmp.Kind {
	case JoinByColumValueKind:
		spec = &JoinByColumnValueSpec{}
	case MergeByColumnsKind:
		spec = &MergeColumnsSpec{}
	case MergeIndexedColumnsKind:
		spec = &MergeIndexedColumnsSpec{}
	case MergeSeriesKind:
		spec = &MergeSeriesSpec{}
	default:
		return fmt.Errorf("unknown transform.kind %q used", tmp.Kind)
	}
	if unMarshalErr := staticUnmarshal(rawSpec, spec); unMarshalErr != nil {
		return unMarshalErr
	}
	t.Kind = tmp.Kind
	t.Spec = spec
	return nil
}
