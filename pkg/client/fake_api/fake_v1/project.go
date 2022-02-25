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
	"time"

	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func ProjectList(prefix string) []*modelV1.Project {
	initialList := []*modelV1.Project{
		{
			Kind: modelV1.KindProject,
			Metadata: modelV1.Metadata{
				Name: "perses",
			},
		},
		{
			Kind: modelV1.KindProject,
			Metadata: modelV1.Metadata{
				Name: "Amadeus",
			},
		},
		{
			Kind: modelV1.KindProject,
			Metadata: modelV1.Metadata{
				Name: "Chronosphere",
			},
		},
	}
	var result []*modelV1.Project
	for _, p := range initialList {
		if len(prefix) == 0 || strings.HasPrefix(p.Metadata.Name, prefix) {
			result = append(result, p)
		}
	}
	return result
}

type project struct {
	v1.ProjectInterface
}

func (c *project) Create(entity *modelV1.Project) (*modelV1.Project, error) {
	return entity, nil
}

func (c *project) Update(entity *modelV1.Project) (*modelV1.Project, error) {
	return entity, nil
}

func (c *project) Delete(_ string) error {
	return nil
}

func (c *project) Get(name string) (*modelV1.Project, error) {
	return &modelV1.Project{
		Kind: modelV1.KindProject,
		Metadata: modelV1.Metadata{
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Name:      name,
		},
	}, nil
}

func (c *project) List(prefix string) ([]*modelV1.Project, error) {
	return ProjectList(prefix), nil
}
