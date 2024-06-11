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

type Mode string

const (
	PercentMode  Mode = "percent"
	AbsoluteMode Mode = "absolute"
)

type StepOption struct {
	Value float64 `json:"value" yaml:"value"`
	Color string  `json:"color,omitempty" yaml:"color,omitempty"`
	Name  string  `json:"name,omitempty" yaml:"name,omitempty"`
}

type Thresholds struct {
	Mode         Mode         `json:"mode,omitempty" yaml:"mode,omitempty"`
	DefaultColor string       `json:"defaultColor,omitempty" yaml:"defaultColor,omitempty"`
	Steps        []StepOption `json:"steps,omitempty" yaml:"steps,omitempty"`
}
