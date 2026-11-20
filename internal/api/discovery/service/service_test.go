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
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/perses/perses/internal/api/authorization"
	databaseFile "github.com/perses/perses/internal/api/database/file"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	globaldatasourceImpl "github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/perses/spec/go/plugin"
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

// Create mirrors the real service: the server-managed Source is stripped, so a
// test fails loudly if Apply wrongly calls Create instead of CreateForDiscovery.
func (f *fakeGlobalDatasourceService) Create(_ *echo.Context, entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	if _, exists := f.store[entity.Metadata.Name]; exists {
		return nil, &databaseModel.Error{Code: databaseModel.ErrorCodeConflict, Key: entity.Metadata.Name}
	}
	entity.Source = nil
	f.store[entity.Metadata.Name] = entity
	return entity, nil
}

// Update mirrors the real service: the Source is preserved from the stored
// entity, so a test fails loudly if Apply wrongly calls Update instead of
// UpdateForDiscovery (the discovery stamp would not change).
func (f *fakeGlobalDatasourceService) Update(_ *echo.Context, entity *v1.GlobalDatasource, _ apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	if old, exists := f.store[entity.Metadata.Name]; exists {
		entity.Source = old.Source
	}
	f.store[entity.Metadata.Name] = entity
	return entity, nil
}

func (f *fakeGlobalDatasourceService) Delete(_ *echo.Context, parameters apiInterface.Parameters) error {
	if _, exists := f.store[parameters.Name]; !exists {
		return &databaseModel.Error{Code: databaseModel.ErrorCodeNotFound, Key: parameters.Name}
	}
	delete(f.store, parameters.Name)
	return nil
}

func (f *fakeGlobalDatasourceService) Get(parameters apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	ds, ok := f.store[parameters.Name]
	if !ok {
		return nil, &databaseModel.Error{Code: databaseModel.ErrorCodeNotFound, Key: parameters.Name}
	}
	return ds, nil
}

func (f *fakeGlobalDatasourceService) List(q *globaldatasource.Query) ([]*v1.GlobalDatasource, error) {
	if f.listError != nil {
		return nil, f.listError
	}
	var filtered []*v1.GlobalDatasource
	for _, ds := range f.store {
		if q.MatchDiscovery(ds) {
			filtered = append(filtered, ds)
		}
	}
	return filtered, nil
}

func (f *fakeGlobalDatasourceService) CreateForDiscovery(entity *v1.GlobalDatasource) (*v1.GlobalDatasource, error) {
	if _, exists := f.store[entity.Metadata.Name]; exists {
		return nil, &databaseModel.Error{Code: databaseModel.ErrorCodeConflict, Key: entity.Metadata.Name}
	}
	f.store[entity.Metadata.Name] = entity
	return entity, nil
}

func (f *fakeGlobalDatasourceService) UpdateForDiscovery(entity *v1.GlobalDatasource, _ apiInterface.Parameters) (*v1.GlobalDatasource, error) {
	f.store[entity.Metadata.Name] = entity
	return entity, nil
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
		Metadata: v1.Metadata{Name: name},
		Spec:     datasourceSpec.Spec{},
	}
}

func storeEntity(name string, discoveryName string) *v1.GlobalDatasource {
	return &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
		Source: &v1.Source{
			Discovery: &v1.DiscoverySource{
				Name: discoveryName,
				Type: v1.DiscoveryTypeKubernetes,
			},
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
	svc := New(false, fake, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{makeEntity("ds-a1"), makeEntity("ds-a2")}))

	require.Len(t, fake.store, 2)
	for _, name := range []string{"ds-a1", "ds-a2"} {
		ds, ok := fake.store[name]
		require.True(t, ok)
		require.NotNil(t, ds.Source)
		require.NotNil(t, ds.Source.Discovery)
		assert.Equal(t, "kube-prod", ds.Source.Discovery.Name)
		assert.Equal(t, v1.DiscoveryTypeKubernetes, ds.Source.Discovery.Type)
	}
}

func TestApply_NoDeleteWhenListErrors(t *testing.T) {
	fake := newFakeService(
		storeEntity("ds-a1", "kube-prod"),
		storeEntity("ds-a2", "kube-prod"),
	)
	fake.listError = fmt.Errorf("database unavailable")
	svc := New(false, fake, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	// Apply with an empty list — without the guard, this would delete everything.
	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{}))

	assert.ElementsMatch(t, []string{"ds-a1", "ds-a2"}, storeNames(fake),
		"no deletes should happen when List returns an error")
}

func TestApply_UpdatesExistingOwnedDatasource(t *testing.T) {
	existing := storeEntity("ds-a1", "kube-prod")
	existing.Spec.Default = false
	fake := newFakeService(existing)
	svc := New(false, fake, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	// ds-a1 is re-discovered; Apply should update it (conflict → Get → ownership match → Update).
	updated := makeEntity("ds-a1")
	updated.Spec.Default = true
	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{updated}))

	ds := fake.store["ds-a1"]
	require.NotNil(t, ds)
	assert.True(t, ds.Spec.Default, "spec should be updated")
	require.NotNil(t, ds.Source.GetDiscovery())
	assert.Equal(t, "kube-prod", ds.Source.Discovery.Name, "source must be stamped after update")
}

func TestApply_DoesNotTakeOverAnotherDiscoverysDatasource(t *testing.T) {
	// ds-b1 is owned by kube-staging; kube-prod must not overwrite it.
	fake := newFakeService(storeEntity("ds-b1", "kube-staging"))
	svc := New(false, fake, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	// Apply succeeds (collision is warned and skipped, not propagated as an error).
	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{makeEntity("ds-b1")}))

	ds := fake.store["ds-b1"]
	require.NotNil(t, ds)
	assert.Equal(t, "kube-staging", ds.Source.Discovery.Name, "ownership must not change")
}

func TestApply_AdoptsNilSourceDatasource(t *testing.T) {
	// ds-manual was created before discovery; it has no Source.
	manual := makeEntity("ds-manual")
	fake := newFakeService(manual)
	svc := New(false, fake, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{makeEntity("ds-manual")}))

	ds := fake.store["ds-manual"]
	require.NotNil(t, ds)
	require.NotNil(t, ds.Source.GetDiscovery(), "nil-source datasource should be adopted")
	assert.Equal(t, "kube-prod", ds.Source.Discovery.Name)
}

func TestApplyService_PreservesDefault(t *testing.T) {
	// Stored datasource is marked as default; the newly-discovered entity does NOT
	// have Default set. Apply passes the discovered entity through to UpdateForDiscovery,
	// so the discovered value wins (Default becomes false).
	existing := storeEntity("ds-a1", "kube-prod")
	existing.Spec.Default = true
	fake := newFakeService(existing)
	svc := New(false, fake, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	discovered := makeEntity("ds-a1")
	discovered.Spec.Default = false
	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{discovered}))

	ds := fake.store["ds-a1"]
	require.NotNil(t, ds)
	assert.False(t, ds.Spec.Default, "discovered value wins; stored Default must not be preserved")
	require.NotNil(t, ds.Source.GetDiscovery())
	assert.Equal(t, "kube-prod", ds.Source.Discovery.Name)
}

// newRealGlobalDatasourceService wires the real globaldatasource service backed
// by a temporary file-based database, so Apply is exercised end-to-end rather
// than against a fake. Schema validation is skipped (nil schema) to avoid a
// dependency on loaded plugins.
func newRealGlobalDatasourceService(t *testing.T) globaldatasource.Service {
	t.Helper()
	fileDAO := &databaseFile.DAO{
		Folder:    t.TempDir(),
		Extension: config.JSONExtension,
	}
	dao := globaldatasourceImpl.NewDAO(fileDAO)
	authz, err := authorization.New(nil, nil, nil, nil, nil, config.Config{})
	require.NoError(t, err)
	guard := netguard.New(config.DatasourceProxyConfig{})
	return globaldatasourceImpl.NewService(config.DatasourceConfig{}, dao, nil, authz, guard)
}

func realEntity(name string) *v1.GlobalDatasource {
	return &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
		Spec: datasourceSpec.Spec{
			Plugin: plugin.Plugin{Kind: "PrometheusDatasource"},
		},
	}
}

// TestApply_RealService_StampsSource runs Apply against the real service. If
// Apply were to call the public Create (which strips Source) instead of
// CreateForDiscovery, the persisted datasource would lose its discovery stamp
// and this test would fail.
func TestApply_RealService_StampsSource(t *testing.T) {
	realSvc := newRealGlobalDatasourceService(t)
	svc := New(false, realSvc, v1.DiscoverySource{Name: "kube-prod", Type: v1.DiscoveryTypeKubernetes})

	require.NoError(t, svc.Apply(context.Background(), []*v1.GlobalDatasource{realEntity("ds-a1")}))

	got, err := realSvc.Get(apiInterface.Parameters{Name: "ds-a1"})
	require.NoError(t, err)
	require.NotNil(t, got.Source.GetDiscovery(), "Apply must persist the discovery source via CreateForDiscovery")
	assert.Equal(t, "kube-prod", got.Source.Discovery.Name)
	assert.Equal(t, v1.DiscoveryTypeKubernetes, got.Source.Discovery.Type)
}

// TestApply_RealService_SwitchDiscoveryType runs Apply twice against the real
// service: first a kubernetes discovery stamps the datasource, then an http
// discovery of the same name re-applies it. The stored discovery type must
// follow the latest owning discovery.
func TestApply_RealService_SwitchDiscoveryType(t *testing.T) {
	realSvc := newRealGlobalDatasourceService(t)

	kubeSvc := New(false, realSvc, v1.DiscoverySource{Name: "sd", Type: v1.DiscoveryTypeKubernetes})
	require.NoError(t, kubeSvc.Apply(context.Background(), []*v1.GlobalDatasource{realEntity("ds-a1")}))

	httpSvc := New(false, realSvc, v1.DiscoverySource{Name: "sd", Type: v1.DiscoveryTypeHTTP})
	require.NoError(t, httpSvc.Apply(context.Background(), []*v1.GlobalDatasource{realEntity("ds-a1")}))

	got, err := realSvc.Get(apiInterface.Parameters{Name: "ds-a1"})
	require.NoError(t, err)
	require.NotNil(t, got.Source.GetDiscovery())
	assert.Equal(t, "sd", got.Source.Discovery.Name)
	assert.Equal(t, v1.DiscoveryTypeHTTP, got.Source.Discovery.Type, "re-apply must update the stored discovery type via UpdateForDiscovery")
}
