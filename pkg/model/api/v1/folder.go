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

	modelAPI "github.com/perses/perses/pkg/model/api"
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

func (f *Folder) GetMetadata() modelAPI.Metadata {
	return &f.Metadata
}

func (f *Folder) GetKind() string {
	return string(f.Kind)
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
	// Verify there is only one reference to a dashboard.
	// We have to limit it because otherwise in the UI we won't be able to determinate from which folder the dashboard is coming from.
	// You will likely have this link https://perses-dev/project/<your_project>/folders/<folder_name>/<dashboard_name>.
	// Because the number of folders you can describe in this document is not limited but the URL is limited, you won't be able to put the folder tree in the URL.
	//
	// So if the dashboard is referenced in multiple sub-folder, the UI won't be able to know from which folder the dashboard is coming from.
	folderList := make([]FolderSpec, len(f.Spec))
	copy(folderList, f.Spec)
	dashboardSet := make(map[string]bool)
	for len(folderList) > 0 {
		var current FolderSpec
		current, folderList = folderList[0], folderList[1:]
		if current.Kind == KindDashboard {
			if !dashboardSet[current.Name] {
				dashboardSet[current.Name] = true
			} else {
				return fmt.Errorf("dashboard %q is referenced multiple times in the folder %q", current.Name, f.Metadata.Name)
			}
		} else {
			folderList = append(folderList, current.Spec...)
		}
	}
	return nil
}
