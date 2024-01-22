// Copyright 2024 The Perses Authors
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

package sdk

import (
	modelAPI "github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

func NewDatasource(name string) *DatasourceBuilder {
	return &DatasourceBuilder{
		v1.Datasource{
			Kind: v1.KindDatasource,
			Metadata: v1.ProjectMetadata{
				Metadata: v1.Metadata{
					Name: name,
				},
			},
		},
	}
}

type DatasourceBuilder struct {
	v1.Datasource
}

func (b *DatasourceBuilder) Build() v1.Datasource {
	return b.Datasource
}

func (b *DatasourceBuilder) GetEntity() modelAPI.Entity {
	return &b.Datasource
}

func (b *DatasourceBuilder) WithName(name string) *DatasourceBuilder {
	b.Datasource.Metadata.Name = name
	return b
}

func (b *DatasourceBuilder) WithProject(project v1.Project) *DatasourceBuilder {
	b.Datasource.Metadata.Project = project.Metadata.Name
	return b
}

func (b *DatasourceBuilder) WithProjectName(projectName string) *DatasourceBuilder {
	b.Datasource.Metadata.Project = projectName
	return b
}

func (b *DatasourceBuilder) WithDefault(isDefault bool) *DatasourceBuilder {
	b.Datasource.Spec.Default = isDefault
	return b
}

func (b *DatasourceBuilder) WithPlugin(plugin common.Plugin) *DatasourceBuilder {
	b.Datasource.Spec.Plugin = plugin
	return b
}
