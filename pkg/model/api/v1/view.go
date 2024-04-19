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

package v1

import (
	"encoding/json"
	"fmt"
)

type View struct {
	// The resource being viewed.
	Project   string `json:"project" yaml:"project"`
	Dashboard string `json:"dashboard" yaml:"dashboard"`

	// Stats about the view.
	RenderTimeSecs float64 `json:"render_time" yaml:"render_time"`
	RenderErrors   int     `json:"render_errors" yaml:"render_errors"`
}

func (v *View) UnmarshalJSON(data []byte) error {
	var tmp View
	type plain View

	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}

	if err := tmp.validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *View) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp View
	type plain View

	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}

	if err := tmp.validate(); err != nil {
		return err
	}
	*v = tmp
	return nil
}

func (v *View) validate() error {
	if v.Project == "" {
		return fmt.Errorf("project cannot be empty")
	}

	if v.Dashboard == "" {
		return fmt.Errorf("dashboard cannot be empty")
	}

	if v.RenderErrors < 0 {
		return fmt.Errorf("render_errors cannot be negative")
	}

	if v.RenderTimeSecs < 0 {
		return fmt.Errorf("render_time cannot be negative")
	}

	return nil
}
