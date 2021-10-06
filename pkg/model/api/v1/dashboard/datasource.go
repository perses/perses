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

	"github.com/perses/perses/pkg/model/api/v1/datasource"
)

type Datasource struct {
	// Name is the name of the datasource
	Name string `json:"name" yaml:"name"`
	// Kind is the datasource kind
	Kind datasource.Kind `json:"kind" yaml:"kind"`
	// If global is true, we are referencing a global datasource.
	// When set to false, we are referencing a datasource in the same project as the current dashboard.
	Global bool `json:"global" yaml:"global"`
}

func (d *Datasource) UnmarshalJSON(data []byte) error {
	var tmp Datasource
	type plain Datasource
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *Datasource) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Datasource
	type plain Datasource
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *Datasource) validate() error {
	if len(d.Name) == 0 {
		return fmt.Errorf("datasource.name cannot be empty")
	}
	return nil
}
