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
	"fmt"
	"testing"

	"github.com/labstack/echo/v4"
	apiInterface "github.com/perses/perses/internal/api/interface"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fakeGlobalDatasourceService is an in-memory implementation of globaldatasource.Service for testing.
type fakeGlobalDatasourceService struct {
	store     map[string]*v1.GlobalDatasource
	listError error
}

var _ globaldatasource.Service = &fakeGlobalDatasourceService{}

func newFakeService(initial ...*v1.GlobalDatasource) *fakeGlobalDatasourceService {
	store := make(map[string]*v1.GlobalDatasource)
	for _, ds := range initial {
		store[ds.Metadata.Name] = ds
	}
	return &fakeGlobalDatasourceService{store: store}
}

func (f *fakeGlobalDatasourceService) Create(_ echo.Context, entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	if _, exists := f.store[entity.Metadata.Name]; exists {
		return nil, &databaseModel.Error{Code: databaseModel.ErrorCodeConflict, Key: entity.Metadata.Name}
	}
	f.store[entity.Metadata.Name] = entity
	return entity, nil
}

func (f *fakeGlobalDatasourceService) Update(_ echo.Context, entity *v1.GlobalDatasource, _ apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	f.store[entity.Metadata.Name] = entity
	return entity, nil
}

func (f *fakeGlobalDatasourceService) Delete(_ echo.Context, parameters apiInterface.Parameters) error {
	delete(f.store, parameters.Name)
	return nil
}

func (f *fakeGlobalDatasourceService) Get(parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	ds, ok := f.store[parameters.Name]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	return ds, nil
}

func (f *fakeGlobalDatasourceService) List(q *globaldatasource.Query) ([]*v1.GlobalDatasource, error) {
	if f.listError != nil {
		return nil, f.listError
	}
	var result []*v1.GlobalDatasource
	for _, ds := range f.store {
		result = append(result, ds)
	}
	// apply the same source + discoveryName filter that persistence.go applies
	if q.Source == "" {
		return result, nil
	}
	var filtered []*v1.GlobalDatasource
	for _, ds := range result {
		if q.DiscoveryName != "" && ds.Metadata.DiscoveryName != q.DiscoveryName {
			continue
		}
		if ds.Metadata.Source == q.Source {
			filtered = append(filtered, ds)
		}
	}
	return filtered, nil
}

func (f *fakeGlobalDatasourceService) RawList(_ *globaldatasource.Query) ([]json.RawMessage, error) {
	return nil, fmt.Errorf("not implemented")
}

func (f *fakeGlobalDatasourceService) MetadataList(_ *globaldatasource.Query) ([]api.Entity, error) {
	return nil, fmt.Errorf("not implemented")
}

func (f *fakeGlobalDatasourceService) RawMetadataList(_ *globaldatasource.Query) ([]json.RawMessage, error) {
	return nil, fmt.Errorf("not implemented")
}

// helpers

func makeEntity(name string) *v1.GlobalDatasource {
	return &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.DatasourceMetadata{Metadata: v1.Metadata{Name: name}},
		Spec:     datasourceSpec.Spec{},
	}
}

func storeEntity(name string, source v1.MetadataSource, discoveryName string) *v1.GlobalDatasource {
	return &v1.GlobalDatasource{
		Kind: v1.KindGlobalDatasource,
		Metadata: v1.DatasourceMetadata{
			Metadata:      v1.Metadata{Name: name},
			Source:        source,
			DiscoveryName: discoveryName,
		},
		Spec: datasourceSpec.Spec{},
	}
}

func storeNames(svc *fakeGlobalDatasourceService) []string {
	var names []string
	for name := range svc.store {
		names = append(names, name)
	}
	return names
}

// tests

func TestApply_StampsSourceAndDiscoveryName(t *testing.T) {
	fake := newFakeService()
	svc := New(false, fake, "kube-prod")

	svc.Apply([]*v1.GlobalDatasource{makeEntity("ds-a1"), makeEntity("ds-a2")})

	require.Len(t, fake.store, 2)
	for _, name := range []string{"ds-a1", "ds-a2"} {
		ds, ok := fake.store[name]
		require.True(t, ok)
		assert.Equal(t, v1.DiscoverySource, ds.Metadata.Source)
		assert.Equal(t, "kube-prod", ds.Metadata.DiscoveryName)
	}
}

func TestApply_DeletesStaleEntriesScopedToDiscovery(t *testing.T) {
	// Pre-populate: kube-prod owns ds-a1 and ds-a2; kube-staging owns ds-b1.
	fake := newFakeService(
		storeEntity("ds-a1", v1.DiscoverySource, "kube-prod"),
		storeEntity("ds-a2", v1.DiscoverySource, "kube-prod"),
		storeEntity("ds-b1", v1.DiscoverySource, "kube-staging"),
	)
	svc := New(false, fake, "kube-prod")

	// kube-prod's new result contains only ds-a1 — ds-a2 has disappeared.
	svc.Apply([]*v1.GlobalDatasource{makeEntity("ds-a1")})

	assert.ElementsMatch(t, []string{"ds-a1", "ds-b1"}, storeNames(fake),
		"ds-a2 should be deleted; ds-b1 (owned by kube-staging) must not be touched")
}

func TestApply_NoDeleteWhenListErrors(t *testing.T) {
	fake := newFakeService(
		storeEntity("ds-a1", v1.DiscoverySource, "kube-prod"),
		storeEntity("ds-a2", v1.DiscoverySource, "kube-prod"),
	)
	fake.listError = fmt.Errorf("database unavailable")
	svc := New(false, fake, "kube-prod")

	// Apply with an empty list — without the guard, this would delete everything.
	svc.Apply([]*v1.GlobalDatasource{})

	assert.ElementsMatch(t, []string{"ds-a1", "ds-a2"}, storeNames(fake),
		"no deletes should happen when List returns an error")
}
