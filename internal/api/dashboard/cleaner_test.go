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

package dashboard

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/perses/perses/pkg/model/api"

	"github.com/perses/perses/internal/api/interface/v1/ephemeraldashboard"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

type mockDAO struct {
	dashboards []*v1.EphemeralDashboard
}

func (d *mockDAO) List(_ *ephemeraldashboard.Query) ([]*v1.EphemeralDashboard, error) {
	return d.dashboards, nil
}

func (d *mockDAO) RawList(_ *ephemeraldashboard.Query) ([]json.RawMessage, error) {
	result := make([]json.RawMessage, 0, len(d.dashboards))
	for _, dash := range d.dashboards {
		b, _ := json.Marshal(dash)
		result = append(result, b)
	}
	return result, nil
}

func (d *mockDAO) MetadataList(_ *ephemeraldashboard.Query) ([]api.Entity, error) {
	var result []api.Entity
	for _, dashboard := range d.dashboards {
		result = append(result, &v1.PartialProjectEntity{
			Kind:     dashboard.Kind,
			Metadata: dashboard.Metadata,
			Spec:     struct{}{},
		})
	}
	return result, nil
}

func (d *mockDAO) RawMetadataList(_ *ephemeraldashboard.Query) ([]json.RawMessage, error) {
	result := make([]json.RawMessage, 0, len(d.dashboards))
	for _, dash := range d.dashboards {
		partial := &v1.PartialProjectEntity{
			Kind:     dash.Kind,
			Metadata: dash.Metadata,
			Spec:     struct{}{},
		}
		b, _ := json.Marshal(partial)
		result = append(result, b)
	}
	return result, nil
}

func (d *mockDAO) Delete(project string, name string) error {
	for ed := range d.dashboards {
		if d.dashboards[ed].Metadata.Project == project && d.dashboards[ed].Metadata.Name == name {
			d.dashboards = append(d.dashboards[:ed], d.dashboards[ed+1:]...)
			return nil
		}
	}
	return nil
}

// unused but required by interface contract
func (d *mockDAO) Create(_ *v1.EphemeralDashboard) error {
	return nil
}

// unused but required by interface contract
func (d *mockDAO) Update(_ *v1.EphemeralDashboard) error {
	return nil
}

// unused but required by interface contract
func (d *mockDAO) DeleteAll(_ string) error {
	return nil
}

// unused but required by interface contract
func (d *mockDAO) Get(_ string, _ string) (*v1.EphemeralDashboard, error) {
	return nil, nil
}

func TestCleaner_Execute(t *testing.T) {
	var ephemeralDashboardsInit = []*v1.EphemeralDashboard{
		{
			Metadata: v1.ProjectMetadata{
				Metadata: v1.Metadata{
					UpdatedAt: time.Now().Add(-time.Hour), // TTL has passed
				},
			},
			Spec: v1.EphemeralDashboardSpec{
				EphemeralDashboardSpecBase: v1.EphemeralDashboardSpecBase{
					TTL: model.Duration(30 * time.Minute),
				},
			},
		},
		{
			Metadata: v1.ProjectMetadata{
				Metadata: v1.Metadata{
					UpdatedAt: time.Now(), // TTL still valid
				},
			},
			Spec: v1.EphemeralDashboardSpec{
				EphemeralDashboardSpecBase: v1.EphemeralDashboardSpecBase{
					TTL: model.Duration(time.Hour),
				},
			},
		},
	}

	var ephemeralDashboardsExpected = []*v1.EphemeralDashboard{
		ephemeralDashboardsInit[1],
	}

	mockDAO := &mockDAO{
		dashboards: ephemeralDashboardsInit,
	}

	cleaner := &Cleaner{
		dao: mockDAO,
	}

	err := cleaner.Execute(context.Background(), func() {})
	assert.NoError(t, err)
	assert.Equal(t, mockDAO.dashboards, ephemeralDashboardsExpected)
}
