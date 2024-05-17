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

package v1

import modelAPI "github.com/perses/perses/pkg/model/api"

type PartialEntity struct {
	Kind     Kind     `json:"kind" yaml:"kind"`
	Metadata Metadata `json:"metadata" yaml:"metadata"`
	Spec     struct{} `json:"spec,omitempty" yaml:"spec,omitempty"`
}

func (p *PartialEntity) GetMetadata() modelAPI.Metadata {
	return &p.Metadata
}

func (p *PartialEntity) GetKind() string {
	return string(p.Kind)
}

func (p *PartialEntity) GetSpec() interface{} {
	return p.Spec
}

type PartialProjectEntity struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     struct{}        `json:"spec,omitempty" yaml:"spec,omitempty"`
}

func (p *PartialProjectEntity) GetMetadata() modelAPI.Metadata {
	return &p.Metadata
}

func (p *PartialProjectEntity) GetKind() string {
	return string(p.Kind)
}

func (p *PartialProjectEntity) GetSpec() interface{} {
	return p.Spec
}
