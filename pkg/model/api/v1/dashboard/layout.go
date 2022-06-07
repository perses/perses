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

package dashboard

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"gopkg.in/yaml.v2"
)

type LayoutKind string

const (
	KindGridLayout LayoutKind = "Grid"
)

var layoutKindMap = map[LayoutKind]bool{
	KindGridLayout: true,
}

func (k *LayoutKind) UnmarshalJSON(data []byte) error {
	var tmp LayoutKind
	type plain LayoutKind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *LayoutKind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp LayoutKind
	type plain LayoutKind
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *LayoutKind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("layout.kind cannot be empty")
	}
	if _, ok := layoutKindMap[*k]; !ok {
		return fmt.Errorf("unknown layout.kind %q used", *k)
	}
	return nil
}

type GridItem struct {
	X       int             `json:"x" yaml:"x"`
	Y       int             `json:"y" yaml:"y"`
	Width   int             `json:"width" yaml:"width"`
	Height  int             `json:"height" yaml:"height"`
	Content *common.JSONRef `json:"content" yaml:"content"`
}

type GridLayoutCollapse struct {
	Open bool `json:"open" yaml:"open"`
}

type GridLayoutDisplay struct {
	Title    string              `json:"title" yaml:"title"`
	Collapse *GridLayoutCollapse `json:"collapse,omitempty" yaml:"collapse,omitempty"`
}

type GridLayoutSpec struct {
	Display *GridLayoutDisplay `json:"display,omitempty" yaml:"display,omitempty"`
	Items   []GridItem         `json:"items" yaml:"items"`
}

type LayoutSpec interface {
}

type tmpDashboardLayout struct {
	Kind LayoutKind             `json:"kind" yaml:"kind"`
	Spec map[string]interface{} `json:"spec" yaml:"spec"`
}

type Layout struct {
	Kind LayoutKind `json:"kind" yaml:"kind"`
	Spec LayoutSpec `json:"spec" yaml:"spec"`
}

func (d *Layout) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(panel interface{}) error {
		return json.Unmarshal(data, panel)
	}
	return d.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (d *Layout) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return d.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (d *Layout) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmpLayout tmpDashboardLayout
	if err := unmarshal(&tmpLayout); err != nil {
		return err
	}
	d.Kind = tmpLayout.Kind

	if len(tmpLayout.Kind) == 0 {
		return fmt.Errorf("variable.kind cannot be empty")
	}

	rawParameter, err := staticMarshal(tmpLayout.Spec)
	if err != nil {
		return err
	}
	var spec interface{}
	switch tmpLayout.Kind {
	case KindGridLayout:
		spec = &GridLayoutSpec{}
	}
	if err := staticUnmarshal(rawParameter, spec); err != nil {
		return err
	}
	d.Spec = spec
	return nil
}
