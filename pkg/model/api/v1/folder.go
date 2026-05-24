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

	modelAPI "github.com/perses/perses/pkg/model/api"
)

type FolderDisplay struct {
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
}

// FolderItem is a single node in the folder tree. Kind is either "Dashboard" or "Folder".
// When Kind is "Folder", Items holds the nested children.
type FolderItem struct {
	// Kind can only have two values: `Dashboard` or `Folder`
	Kind Kind `json:"kind" yaml:"kind"`
	// Name is the reference to the dashboard when `Kind` is equal to `Dashboard`.
	// When `Kind` is equal to `Folder`, then it's just the name of the folder.
	Name  string       `json:"name" yaml:"name"`
	Items []FolderItem `json:"items,omitempty" yaml:"items,omitempty"`
}

func (f *FolderItem) UnmarshalJSON(data []byte) error {
	var tmp FolderItem
	type plain FolderItem
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *FolderItem) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp FolderItem
	type plain FolderItem
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *FolderItem) validate() error {
	if f.Kind != KindDashboard && f.Kind != KindFolder {
		return fmt.Errorf("kind can only be %q or %q but not %q", KindDashboard, KindFolder, f.Kind)
	}
	if len(f.Name) == 0 {
		return fmt.Errorf("name is required")
	}
	if f.Kind == KindDashboard && len(f.Items) > 0 {
		return fmt.Errorf("when kind is equal to %q, then items must be empty", KindDashboard)
	}
	return nil
}

type FolderSpec struct {
	Display *FolderDisplay `json:"display,omitempty" yaml:"display,omitempty"`
	Items   []FolderItem   `json:"items,omitempty" yaml:"items,omitempty"`
}

type Folder struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     FolderSpec      `json:"spec" yaml:"spec"`
}

func (f *Folder) GetMetadata() modelAPI.Metadata {
	return &f.Metadata
}

func (f *Folder) GetKind() string {
	return string(f.Kind)
}

func (f *Folder) GetSpec() any {
	return f.Spec
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

func (f *Folder) UnmarshalYAML(unmarshal func(any) error) error {
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
	// Verify there is only one reference to a dashboard.
	// We have to limit it because otherwise in the UI we won't be able to determinate from which folder the dashboard is coming from.
	// You will likely have this link https://perses-dev/project/<your_project>/folders/<folder_name>/<dashboard_name>.
	// Because the number of folders you can describe in this document is not limited but the URL is limited, you won't be able to put the folder tree in the URL.
	//
	// So if the dashboard is referenced in multiple sub-folder, the UI won't be able to know from which folder the dashboard is coming from.
	itemList := make([]FolderItem, len(f.Spec.Items))
	copy(itemList, f.Spec.Items)
	dashboardSet := make(map[string]bool)
	for len(itemList) > 0 {
		var current FolderItem
		current, itemList = itemList[0], itemList[1:]
		if current.Kind == KindDashboard {
			if !dashboardSet[current.Name] {
				dashboardSet[current.Name] = true
			} else {
				return fmt.Errorf("dashboard %q is referenced multiple times in the folder %q", current.Name, f.Metadata.Name)
			}
		} else {
			itemList = append(itemList, current.Items...)
		}
	}
	return nil
}
