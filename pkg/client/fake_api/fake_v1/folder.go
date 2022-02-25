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

package fake_v1

import (
	"strings"

	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func FolderList(project string, prefix string) []*modelV1.Folder {
	initialList := []*modelV1.Folder{
		{
			Kind: modelV1.KindFolder,
			Metadata: modelV1.ProjectMetadata{
				Metadata: modelV1.Metadata{
					Name: "FF15",
				},
				Project: "perses",
			},
		},
		{
			Kind: modelV1.KindFolder,
			Metadata: modelV1.ProjectMetadata{
				Metadata: modelV1.Metadata{
					Name: "AnotherFolder",
				},
				Project: "AnotherProject",
			},
		},
	}
	var result []*modelV1.Folder
	for _, p := range initialList {
		if (len(prefix) == 0 || strings.HasPrefix(p.Metadata.Name, prefix)) && (len(project) == 0 || p.Metadata.Project == project) {
			result = append(result, p)
		}
	}
	return result
}

type folder struct {
	v1.FolderInterface
	project string
}

func (c *folder) Create(entity *modelV1.Folder) (*modelV1.Folder, error) {
	return entity, nil
}

func (c *folder) Update(entity *modelV1.Folder) (*modelV1.Folder, error) {
	return entity, nil
}

func (c *folder) Delete(_ string) error {
	return nil
}

func (c *folder) Get(name string) (*modelV1.Folder, error) {
	return &modelV1.Folder{

		Kind: modelV1.KindFolder,
		Metadata: modelV1.ProjectMetadata{
			Metadata: modelV1.Metadata{
				Name: name,
			},
			Project: c.project,
		},
	}, nil
}

func (c *folder) List(prefix string) ([]*modelV1.Folder, error) {
	return FolderList(c.project, prefix), nil
}
