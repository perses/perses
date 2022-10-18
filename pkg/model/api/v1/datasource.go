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

	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

func FilterDatasource[T DatasourceInterface](kind string, defaultDTS *bool, list []T) []T {
	result := make([]T, 0, len(list))
	for _, d := range list {
		keep := true
		if len(kind) > 0 && kind != d.GetSpec().Plugin.Kind {
			keep = false
		}
		if defaultDTS != nil && *defaultDTS != d.GetSpec().Default {
			keep = false
		}
		if keep {
			result = append(result, d)
		}
	}
	return result
}

func GenerateGlobalDatasourceID(name string) string {
	return fmt.Sprintf("/globaldatasources/%s", name)
}

func GenerateDatasourceID(project string, name string) string {
	return generateProjectResourceID("datasources", project, name)
}

type DatasourceInterface interface {
	GetMetadata() modelAPI.Metadata
	GetSpec() DatasourceSpec
}

type DatasourceSpec struct {
	Display *common.Display `json:"display,omitempty" yaml:"display,omitempty"`
	Default bool            `json:"default" yaml:"default"`
	// Plugin will contain the datasource configuration.
	// The data typed is available in Cue.
	Plugin common.Plugin `json:"plugin" yaml:"plugin"`
}

// GlobalDatasource is the struct representing the datasource shared to everybody.
// Any Dashboard can reference it.
type GlobalDatasource struct {
	Kind     Kind           `json:"kind" yaml:"kind"`
	Metadata Metadata       `json:"metadata" yaml:"metadata"`
	Spec     DatasourceSpec `json:"spec" yaml:"spec"`
}

func (d *GlobalDatasource) GenerateID() string {
	return GenerateGlobalDatasourceID(d.Metadata.Name)
}

func (d *GlobalDatasource) GetMetadata() modelAPI.Metadata {
	return &d.Metadata
}

func (d *GlobalDatasource) GetKind() string {
	return string(d.Kind)
}

func (d *GlobalDatasource) GetSpec() DatasourceSpec {
	return d.Spec
}

// Datasource will be the datasource you can define in your project/namespace
// This is a resource that won't be shared across projects.
// A Dashboard can use it only if it is in the same project.
type Datasource struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     DatasourceSpec  `json:"spec" yaml:"spec"`
}

func (d *Datasource) GenerateID() string {
	return GenerateDatasourceID(d.Metadata.Project, d.Metadata.Name)
}

func (d *Datasource) GetMetadata() modelAPI.Metadata {
	return &d.Metadata
}

func (d *Datasource) GetKind() string {
	return string(d.Kind)
}

func (d *Datasource) GetSpec() DatasourceSpec {
	return d.Spec
}
