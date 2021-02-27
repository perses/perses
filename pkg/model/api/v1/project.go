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
)

type Project struct {
	Metadata Metadata `json:"metadata"`
}

func (p *Project) GenerateID() string {
	return fmt.Sprintf("/projects/%s", p.Metadata.Name)
}

func (p *Project) UnmarshalJSON(data []byte) error {
	var tmp Project
	type plain Project
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Project) validate() error {
	if p.Metadata.Kind != KindProject {
		return fmt.Errorf("invalid kind: '%s' for a Project type", p.Metadata.Kind)
	}
	return nil
}
