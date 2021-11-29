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
	"encoding/json"
	"fmt"
)

func GenerateFolderID(project string, name string) string {
	return generateProjectResourceID("folders", project, name)
}

type FolderSpec struct {
	// Kind can only have two values: `Dashboard` or `Folder`
	Kind Kind `json:"kind" yaml:"kind"`
	// Name is the reference to the dashboard when `Kind` is equal to `Dashboard`.
	// When `Kind` is equal to `Folder`, then it's just the name of the folder
	Name string `json:"name" yaml:"name"`
	// Spec must only be set when 'Kind' is equal to 'Folder'.
	Spec []FolderSpec `json:"spec,omitempty" yaml:"spec,omitempty"`
}

func (f *FolderSpec) UnmarshalJSON(data []byte) error {
	var tmp FolderSpec
	type plain FolderSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *FolderSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp FolderSpec
	type plain FolderSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *FolderSpec) validate() error {
	if f.Kind != KindDashboard && f.Kind != KindFolder {
		return fmt.Errorf("kind can only be %q or %q but not %q", KindDashboard, KindFolder, f.Kind)
	}
	if f.Kind == KindFolder && len(f.Spec) == 0 {
		return fmt.Errorf("when kind is equal to %q, then spec cannot be empty", KindFolder)
	}
	if f.Kind == KindDashboard && len(f.Spec) > 0 {
		return fmt.Errorf("when kind is equal to %q, then spec must be empty", KindDashboard)
	}
	return nil
}

type Folder struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     []FolderSpec    `json:"spec" yaml:"spec"`
}

func (f *Folder) GenerateID() string {
	return GenerateDashboardID(f.Metadata.Project, f.Metadata.Name)
}

func (f *Folder) GetMetadata() interface{} {
	return &f.Metadata
}

func (f *Folder) UnmarshalJSON(data []byte) error {
	var tmp Folder
	type plain Folder
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *Folder) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Folder
	type plain Folder
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *Folder) validate() error {
	if f.Kind != KindFolder {
		return fmt.Errorf("invalid kind: %q for a Folder type", f.Kind)
	}
	if len(f.Spec) == 0 {
		return fmt.Errorf("spec cannot be empty")
	}
	return nil
}
