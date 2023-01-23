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
	if len(project) == 0 {
		// it's used when we query a list of object. It can happen that the project is empty.
		return fmt.Sprintf("/%s", pluralKind)
	}
	return fmt.Sprintf("/%s/%s/%s", pluralKind, project, name)
}

type Metadata struct {
	Name      string    `json:"name" yaml:"name"`
	CreatedAt time.Time `json:"created_at" yaml:"created_at"`
	UpdatedAt time.Time `json:"updated_at" yaml:"updated_at"`
	Version   uint64    `json:"version" yaml:"version"`
}

func (m *Metadata) CreateNow() {
	m.CreatedAt = time.Now().UTC()
	m.UpdatedAt = m.CreatedAt
	m.Version = 0
}

func (m *Metadata) Update(previous Metadata) {
	// update the immutable field of the newEntity with the old one
	m.CreatedAt = previous.CreatedAt
	// update the field UpdatedAt with the new time
	m.UpdatedAt = time.Now().UTC()
	// increase the version number
	m.Version = previous.Version + 1
}

func (m *Metadata) GetName() string {
	return m.Name
}

// ProjectMetadata is the metadata struct for resources that belongs to a project.
type ProjectMetadata struct {
	Metadata `json:",inline" yaml:",inline"`
	Project  string `json:"project" yaml:"project"`
}

func (m *ProjectMetadata) GetName() string {
	return m.Name
}

func (m *ProjectMetadata) Update(previous ProjectMetadata) {
	m.Metadata.Update(previous.Metadata)
}
