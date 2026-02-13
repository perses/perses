// Copyright The Perses Authors
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
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/perses/common/set"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

func NewMetadata(name string) *Metadata {
	return &Metadata{
		Name: name,
	}
}

var tagsAllowedCharactersRegexp = regexp.MustCompile(`^[a-z0-9 _-]+$`)

type Metadata struct {
	Name string `json:"name" yaml:"name"`
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=date-time
	// +kubebuilder:validation:Optional
	CreatedAt time.Time `json:"createdAt" yaml:"createdAt"`
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=date-time
	// +kubebuilder:validation:Optional
	UpdatedAt time.Time `json:"updatedAt" yaml:"updatedAt"`
	Version   uint64    `json:"version" yaml:"version"`
	// +kubebuilder:validation:Optional
	// +kubebuilder:validation:MaxItems=20
	Tags set.Set[string] `json:"tags,omitempty" yaml:"tags,omitempty"`
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

func (m *Metadata) Flatten(sensitive bool) {
	if !sensitive {
		m.Name = strings.ToLower(m.Name)
	}
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

func (m *Metadata) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp Metadata
	type plain Metadata
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *Metadata) validate() error {
	if err := common.ValidateID(m.Name); err != nil {
		return err
	}

	return m.validateTags()
}

func (m *Metadata) validateTags() error {
	const maxTags = 20
	const maxTagLength = 50

	if len(m.Tags) > maxTags {
		return fmt.Errorf("cannot contain more than %d tags", maxTags)
	}

	for tag := range m.Tags {
		if len(strings.TrimSpace(tag)) == 0 {
			return fmt.Errorf("tag cannot be empty")
		}
		if strings.TrimSpace(tag) != tag {
			return fmt.Errorf("tag %q cannot start or end with whitespace", tag)
		}
		if utf8.RuneCountInString(tag) > maxTagLength {
			return fmt.Errorf("tag %q cannot contain more than %d characters", tag, maxTagLength)
		}
		if !tagsAllowedCharactersRegexp.MatchString(tag) {
			return fmt.Errorf("tag %q contains invalid characters; only lowercase letters, numbers, spaces, hyphens, and underscores are allowed", tag)
		}
	}

	return nil
}

// PublicMetadata is a copy of classic metadata but that doesn't make any validation.
// It is used when returning data to the API consumers.
// It is particularly useful when the API returns some entities that are created on the fly and that doesn't necessarily
// need validation like the kubernetes users.
type PublicMetadata struct {
	Name string `json:"name" yaml:"name"`
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=date-time
	// +kubebuilder:validation:Optional
	CreatedAt time.Time `json:"createdAt" yaml:"createdAt"`
	// +kubebuilder:validation:Schemaless
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=date-time
	// +kubebuilder:validation:Optional
	UpdatedAt time.Time       `json:"updatedAt" yaml:"updatedAt"`
	Version   uint64          `json:"version" yaml:"version"`
	Tags      set.Set[string] `json:"tags,omitempty" yaml:"tags,omitempty"`
}

func NewPublicMetadata(name string) PublicMetadata {
	return PublicMetadata{
		Name: name,
	}
}

func (m *PublicMetadata) CreateNow() {
	m.CreatedAt = time.Now().UTC()
	m.UpdatedAt = m.CreatedAt
	m.Version = 0
}

func (m *PublicMetadata) Update(previous PublicMetadata) {
	// update the immutable field of the newEntity with the old one
	m.CreatedAt = previous.CreatedAt
	// update the field UpdatedAt with the new time
	m.UpdatedAt = time.Now().UTC()
	// increase the version number
	m.Version = previous.Version + 1
}

func (m *PublicMetadata) GetName() string {
	return m.Name
}

func (m *PublicMetadata) Flatten(sensitive bool) {
	if !sensitive {
		m.Name = strings.ToLower(m.Name)
	}
}

func (m *PublicMetadata) UnmarshalJSON(data []byte) error {
	var tmp PublicMetadata
	type plain PublicMetadata
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *PublicMetadata) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp PublicMetadata
	type plain PublicMetadata
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func NewProjectMetadata(project string, name string) *ProjectMetadata {
	return &ProjectMetadata{
		Metadata: Metadata{
			Name: name,
		},
		ProjectMetadataWrapper: ProjectMetadataWrapper{
			Project: project,
		},
	}
}

// This wrapping struct is required to allow defining a custom unmarshall on Metadata
// without breaking the Project attribute (the fact Metadata is injected line in
// ProjectMetadata caused Project string to be ignored when unmarshalling)
type ProjectMetadataWrapper struct {
	Project string `json:"project" yaml:"project"`
}

func (p *ProjectMetadataWrapper) UnmarshalJSON(data []byte) error {
	var tmp ProjectMetadataWrapper
	type plain ProjectMetadataWrapper
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *ProjectMetadataWrapper) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp ProjectMetadataWrapper
	type plain ProjectMetadataWrapper
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	*p = tmp
	return nil
}

// ProjectMetadata is the metadata struct for resources that belongs to a project.
type ProjectMetadata struct {
	Metadata               `json:",inline" yaml:",inline"`
	ProjectMetadataWrapper `json:",inline" yaml:",inline"`
}

// This method is needed in the case of JSON otherwise parts of the fields are missed when unmarshalling
func (pm *ProjectMetadata) UnmarshalJSON(data []byte) error {
	// Call UnmarshalJSON methods of the embedded structs
	var metadataTmp Metadata
	if err := metadataTmp.UnmarshalJSON(data); err != nil {
		return err
	}

	var projectMetadataWrapperTmp ProjectMetadataWrapper
	if err := projectMetadataWrapperTmp.UnmarshalJSON(data); err != nil {
		return err
	}

	pm.Metadata = metadataTmp
	pm.ProjectMetadataWrapper = projectMetadataWrapperTmp

	return nil
}

// This method is needed in the case of YAML otherwise the validation part is not triggered when unmarshalling
func (pm *ProjectMetadata) UnmarshalYAML(unmarshal func(any) error) error {
	// Call UnmarshalYAML methods of the embedded structs
	var metadataTmp Metadata
	if err := metadataTmp.UnmarshalYAML(unmarshal); err != nil {
		return err
	}

	var projectMetadataWrapperTmp ProjectMetadataWrapper
	if err := projectMetadataWrapperTmp.UnmarshalYAML(unmarshal); err != nil {
		return err
	}

	pm.Metadata = metadataTmp
	pm.ProjectMetadataWrapper = projectMetadataWrapperTmp

	return nil
}

func (pm *ProjectMetadata) GetName() string {
	return pm.Name
}

func (pm *ProjectMetadata) Flatten(sensitive bool) {
	if !sensitive {
		pm.Name = strings.ToLower(pm.Name)
		pm.Project = strings.ToLower(pm.Project)
	}
}

func (pm *ProjectMetadata) Update(previous ProjectMetadata) {
	pm.Metadata.Update(previous.Metadata)
}

// PublicProjectMetadata is a copy of classic project metadata but that doesn't make any validation.
// It is used when returning data to the API consumers.
// It is particularly useful when the API returns some entities that are created on the fly and that doesn't necessarily
// need validation like the kubernetes users.
type PublicProjectMetadata struct {
	ProjectMetadataWrapper `json:",inline" yaml:",inline"`
	PublicMetadata         `json:",inline" yaml:",inline"`
}

func NewPublicProjectMetadata(project string, name string) PublicProjectMetadata {
	return PublicProjectMetadata{
		ProjectMetadataWrapper: ProjectMetadataWrapper{
			Project: project,
		},
		PublicMetadata: PublicMetadata{
			Name: name,
		},
	}
}

func NewPublicProjectMetadataFromCopy(metadata ProjectMetadata) PublicProjectMetadata {
	return PublicProjectMetadata{
		ProjectMetadataWrapper: metadata.ProjectMetadataWrapper,
		PublicMetadata:         PublicMetadata(metadata.Metadata),
	}
}

func (pm *PublicProjectMetadata) GetName() string {
	return pm.Name
}

func (pm *PublicProjectMetadata) Flatten(sensitive bool) {
	if !sensitive {
		pm.Name = strings.ToLower(pm.Name)
		pm.Project = strings.ToLower(pm.Project)
	}
}

// This method is needed in the case of JSON otherwise parts of the fields are missed when unmarshalling
func (pm *PublicProjectMetadata) UnmarshalJSON(data []byte) error {
	// Call UnmarshalJSON methods of the embedded structs
	var metadataTmp PublicMetadata
	if err := metadataTmp.UnmarshalJSON(data); err != nil {
		return err
	}

	var projectMetadataWrapperTmp ProjectMetadataWrapper
	if err := projectMetadataWrapperTmp.UnmarshalJSON(data); err != nil {
		return err
	}

	pm.PublicMetadata = metadataTmp
	pm.ProjectMetadataWrapper = projectMetadataWrapperTmp

	return nil
}

// This method is needed in the case of YAML otherwise parts of the fields are missed when unmarshalling
func (pm *PublicProjectMetadata) UnmarshalYAML(unmarshal func(any) error) error {
	// Call UnmarshalYAML methods of the embedded structs
	var metadataTmp PublicMetadata
	if err := metadataTmp.UnmarshalYAML(unmarshal); err != nil {
		return err
	}

	var projectMetadataWrapperTmp ProjectMetadataWrapper
	if err := projectMetadataWrapperTmp.UnmarshalYAML(unmarshal); err != nil {
		return err
	}

	pm.PublicMetadata = metadataTmp
	pm.ProjectMetadataWrapper = projectMetadataWrapperTmp

	return nil
}
