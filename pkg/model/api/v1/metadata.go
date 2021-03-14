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
	"time"
)

func generateProjectResourceID(pluralKind string, project string, name string) string {
	return fmt.Sprintf("/%s/%s/%s", pluralKind, project, name)
}

type Metadata struct {
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (m *Metadata) CreateNow() {
	m.CreatedAt = time.Now().UTC()
	m.UpdatedAt = m.CreatedAt
}

func (m *Metadata) UnmarshalJSON(data []byte) error {
	var tmp Metadata
	type plain Metadata
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *Metadata) validate() error {
	if len(m.Name) == 0 {
		return fmt.Errorf("metadata.name cannot be empty")
	}
	return nil
}

// ProjectMetadata is the metadata struct for resources that belongs to a project.
type ProjectMetadata struct {
	Metadata `json:",inline"`
	Project  string `json:"project"`
}

func (m *ProjectMetadata) UnmarshalJSON(data []byte) error {
	var tmp ProjectMetadata
	type plain ProjectMetadata
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *ProjectMetadata) validate() error {
	if len(m.Project) == 0 {
		return fmt.Errorf("metadata.project cannot be empty")
	}
	return nil
}
