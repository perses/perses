// Copyright 2022 The Perses Authors
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

package api

import (
	"encoding/json"
	"fmt"
)

type Migrate struct {
	Input            map[string]string `json:"input,omitempty"`
	GrafanaDashboard json.RawMessage   `json:"grafana_dashboard"`
}

func (m *Migrate) UnmarshalJSON(data []byte) error {
	var tmp Migrate
	type plain Migrate
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *Migrate) validate() error {
	if len(m.GrafanaDashboard) == 0 {
		return fmt.Errorf("grafana_dashboard cannot be empty")
	}
	return nil
}
