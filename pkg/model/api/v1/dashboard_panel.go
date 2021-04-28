// Copyright 2021 Amadeus s.a.s
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

	"gopkg.in/yaml.v2"
)

type Chart interface {
	GetKind() KindChart
}

type KindChart string

const (
	KindLineChart KindChart = "LineChart"
)

type Line struct {
	Expr   string `json:"expr" yaml:"expr"`
	Legend string `json:"legend,omitempty" yaml:"legend,omitempty"`
}

func (l *Line) UnmarshalJSON(data []byte) error {
	var tmp Line
	type plain Line
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*l = tmp
	return nil
}

func (l *Line) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Line
	type plain Line
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*l = tmp
	return nil
}

func (l *Line) validate() error {
	if len(l.Expr) == 0 {
		return fmt.Errorf("expr cannot be empty for a line")
	}
	return nil
}

type LineChart struct {
	Chart      `json:"-" yaml:"-"`
	Kind       KindChart `json:"kind" yaml:"kind"`
	ShowLegend bool      `json:"show_legend" yaml:"show_legend"`
	Lines      []Line    `json:"lines" yaml:"lines"`
}

func (l *LineChart) GetKind() KindChart {
	return l.Kind
}

func (l *LineChart) UnmarshalJSON(data []byte) error {
	var tmp LineChart
	type plain LineChart
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*l = tmp
	return nil
}

func (l *LineChart) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp LineChart
	type plain LineChart
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*l = tmp
	return nil
}

func (l *LineChart) validate() error {
	if len(l.Lines) == 0 {
		return fmt.Errorf("you need to define at least one line for a LineChart")
	}
	return nil
}

type tmpPanel struct {
	Name string `json:"name" yaml:"name"`
	// Order is used to know the display order
	Order uint64                 `json:"order" yaml:"order"`
	Chart map[string]interface{} `json:"chart" yaml:"chart"`
}

type Panel struct {
	Name string `json:"name" yaml:"name"`
	// Order is used to know the display order
	Order uint64 `json:"order" yaml:"order"`
	Chart Chart  `json:"chart" yaml:"chart"`
}

func (p *Panel) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(panel interface{}) error {
		return json.Unmarshal(data, panel)
	}
	if err := p.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal); err != nil {
		return err
	}
	return p.validate()
}

func (p *Panel) UnmarshalYAML(unmarshal func(interface{}) error) error {
	if err := p.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal); err != nil {
		return err
	}
	return p.validate()
}

func (p *Panel) validate() error {
	if len(p.Name) == 0 {
		return fmt.Errorf("panel.name cannot be empty")
	}
	return nil
}

func (p *Panel) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmpPanel tmpPanel
	if err := unmarshal(&tmpPanel); err != nil {
		return err
	}
	p.Name = tmpPanel.Name
	p.Order = tmpPanel.Order
	chartKind := tmpPanel.Chart["kind"].(string)
	if len(chartKind) == 0 {
		return fmt.Errorf("chart.kind cannot be empty")
	}

	rawChart, err := staticMarshal(tmpPanel.Chart)
	if err != nil {
		return err
	}

	switch chartKind {
	case string(KindLineChart):
		chart := &LineChart{}
		if err := staticUnmarshal(rawChart, chart); err != nil {
			return err
		}
		p.Chart = chart
	default:
		return fmt.Errorf("chart kind not supported: '%s'", chartKind)
	}
	return nil
}
