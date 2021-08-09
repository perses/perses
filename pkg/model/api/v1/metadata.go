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

package v1

import (
	"fmt"
	"time"
)

func generateProjectResourceID(pluralKind string, project string, name string) string {
	return fmt.Sprintf("/%s/%s/%s", pluralKind, project, name)
}

type Metadata struct {
	Name      string    `json:"name" yaml:"name"`
	CreatedAt time.Time `json:"created_at" yaml:"created_at"`
	UpdatedAt time.Time `json:"updated_at" yaml:"updated_at"`
}

func (m *Metadata) CreateNow() {
	m.CreatedAt = time.Now().UTC()
	m.UpdatedAt = m.CreatedAt
}

// ProjectMetadata is the metadata struct for resources that belongs to a project.
type ProjectMetadata struct {
	Metadata `json:",inline" yaml:";,inline"`
	Project  string `json:"project" yaml:"project"`
}
