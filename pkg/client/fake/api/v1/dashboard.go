// Copyright 2025 The Perses Authors
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

package fakev1

import (
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type dashboard struct {
	v1.DashboardInterface
	project string
}

func (d *dashboard) Create(entity *modelV1.Dashboard) (*modelV1.Dashboard, error) {
	return entity, nil
}
func (d *dashboard) Update(entity *modelV1.Dashboard) (*modelV1.Dashboard, error) {
	return entity, nil
}
func (d *dashboard) Delete(_ string) error {
	return nil
}
func (d *dashboard) Get(name string) (*modelV1.Dashboard, error) {
	return &modelV1.Dashboard{

		Kind: modelV1.KindDashboard,
		Metadata: modelV1.ProjectMetadata{
			Metadata: modelV1.Metadata{
				Name: name,
			},
			ProjectMetadataWrapper: modelV1.ProjectMetadataWrapper{
				Project: d.project,
			},
		},
		Spec: modelV1.DashboardSpec{},
	}, nil
}
func (d *dashboard) List(_ string) ([]*modelV1.Dashboard, error) {
	return make([]*modelV1.Dashboard, 0), nil
}
