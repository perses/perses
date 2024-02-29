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

package fakev1

import (
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type ephemeralDashboard struct {
	v1.EphemeralDashboardInterface
}

func (e *ephemeralDashboard) Create(entity *modelV1.EphemeralDashboard) (*modelV1.EphemeralDashboard, error) {
	return entity, nil
}
func (e *ephemeralDashboard) Update(entity *modelV1.EphemeralDashboard) (*modelV1.EphemeralDashboard, error) {
	return entity, nil
}
func (e *ephemeralDashboard) Delete(_ string) error {
	return nil
}
func (e *ephemeralDashboard) Get(_ string) (*modelV1.EphemeralDashboard, error) {
	return nil, nil
}
func (e *ephemeralDashboard) List(_ string) ([]*modelV1.EphemeralDashboard, error) {
	return make([]*modelV1.EphemeralDashboard, 0), nil
}
