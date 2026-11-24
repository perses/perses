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

package proxy

import (
	"encoding/json"
	"testing"

	apiinterface "github.com/perses/perses/internal/api/interface"
	dashboardInterface "github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/dashboard"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// dashboardDAOStub is a dashboard.DAO returning a single dashboard, to exercise the datasource
// lookup of the proxy without a database.
type dashboardDAOStub struct {
	dashboard *v1.Dashboard
}

func (s *dashboardDAOStub) Create(_ *v1.Dashboard) error { return nil }
func (s *dashboardDAOStub) Update(_ *v1.Dashboard) error { return nil }
func (s *dashboardDAOStub) Delete(_ string, _ string) error {
	return nil
}
func (s *dashboardDAOStub) DeleteAll(_ string) error { return nil }
func (s *dashboardDAOStub) Get(_ string, _ string) (*v1.Dashboard, error) {
	return s.dashboard, nil
}
func (s *dashboardDAOStub) List(_ *dashboardInterface.Query) ([]*v1.Dashboard, error) {
	return []*v1.Dashboard{s.dashboard}, nil
}
func (s *dashboardDAOStub) RawList(_ *dashboardInterface.Query) ([]json.RawMessage, error) {
	return nil, nil
}
func (s *dashboardDAOStub) MetadataList(_ *dashboardInterface.Query) ([]api.Entity, error) {
	return nil, nil
}
func (s *dashboardDAOStub) RawMetadataList(_ *dashboardInterface.Query) ([]json.RawMessage, error) {
	return nil, nil
}

// TestGetDashboardDatasourceNullEntry ensures a null local datasource is reported as a not found
// datasource instead of panicking on a nil pointer dereference. The dashboard spec validation
// rejects such an entry at decoding time, so this can only happen with a dashboard stored before
// that check existed.
func TestGetDashboardDatasourceNullEntry(t *testing.T) {
	e := &endpoint{
		dashboard: &dashboardDAOStub{
			dashboard: &v1.Dashboard{
				Kind: v1.KindDashboard,
				Metadata: v1.ProjectMetadata{
					Metadata:               v1.Metadata{Name: "myDashboard"},
					ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: "perses"},
				},
				Spec: dashboard.Spec{
					Datasources: map[string]*datasourceSpec.Spec{"nullDTS": nil},
				},
			},
		},
	}

	_, err := e.getDashboardDatasource("perses", "myDashboard", "nullDTS")

	require.Error(t, err)
	assert.ErrorIs(t, err, apiinterface.NotFoundError)
	assert.ErrorContains(t, err, `unable to forward the request to the datasource "nullDTS", datasource doesn't exist`)
}
