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

package service

import (
	"encoding/json"
	"testing"

	"github.com/labstack/echo/v4"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/datasource"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockGlobalDatasourceService struct {
	createdEntities []*v1.GlobalDatasource
	updateCalls     int
}

func (m *mockGlobalDatasourceService) Create(ctx echo.Context, entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	m.createdEntities = append(m.createdEntities, entity)
	return entity, nil
}

func (m *mockGlobalDatasourceService) Update(ctx echo.Context, entity *v1.GlobalDatasource, parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	m.updateCalls++
	return entity, nil
}

func (m *mockGlobalDatasourceService) Delete(ctx echo.Context, parameters apiInterface.Parameters) error {
	return nil
}

func (m *mockGlobalDatasourceService) Get(parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	return nil, nil
}

func (m *mockGlobalDatasourceService) List(q *globaldatasource.Query) ([]*v1.GlobalDatasource, error) {
	return nil, nil
}

func (m *mockGlobalDatasourceService) MetadataList(q *globaldatasource.Query) ([]api.Entity, error) {
	return nil, nil
}

func (m *mockGlobalDatasourceService) RawList(q *globaldatasource.Query) ([]json.RawMessage, error) {
	return nil, nil
}

func (m *mockGlobalDatasourceService) RawMetadataList(q *globaldatasource.Query) ([]json.RawMessage, error) {
	return nil, nil
}

func newTestDatasource(name string) *v1.GlobalDatasource {
	ds := &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: *v1.NewMetadata(name),
		Spec: datasource.Spec{
			Default: false,
			Plugin: plugin.Plugin{
				Kind: "PrometheusDatasource",
				Spec: map[string]interface{}{},
			},
		},
	}
	return ds
}

func TestApplyService_SetDefaultFlagTrue(t *testing.T) {
	mockSvc := &mockGlobalDatasourceService{}
	applySvc := New(false, mockSvc, true)

	ds := newTestDatasource("prometheus-1")
	entities := []*v1.GlobalDatasource{ds}

	applySvc.Apply(entities)

	require.Equal(t, 1, len(mockSvc.createdEntities), "should have created one datasource")
	assert.Equal(t, true, mockSvc.createdEntities[0].Spec.Default, "default should be set to true")
	assert.Equal(t, "prometheus-1", mockSvc.createdEntities[0].Metadata.Name)
}

func TestApplyService_SetDefaultFlagFalse(t *testing.T) {
	mockSvc := &mockGlobalDatasourceService{}
	applySvc := New(false, mockSvc, false)

	ds := newTestDatasource("loki-1")
	entities := []*v1.GlobalDatasource{ds}

	applySvc.Apply(entities)

	require.Equal(t, 1, len(mockSvc.createdEntities), "should have created one datasource")
	assert.Equal(t, false, mockSvc.createdEntities[0].Spec.Default, "default should be set to false")
	assert.Equal(t, "loki-1", mockSvc.createdEntities[0].Metadata.Name)
}

func TestApplyService_MultipleEntitiesWithDefaultTrue(t *testing.T) {
	mockSvc := &mockGlobalDatasourceService{}
	applySvc := New(false, mockSvc, true)

	entities := []*v1.GlobalDatasource{
		newTestDatasource("prometheus-1"),
		newTestDatasource("prometheus-2"),
		newTestDatasource("prometheus-3"),
	}

	applySvc.Apply(entities)

	require.Equal(t, 3, len(mockSvc.createdEntities), "should have created three datasources")
	for i, created := range mockSvc.createdEntities {
		assert.Equal(t, true, created.Spec.Default, "datasource %d should have default=true", i)
	}
}
