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

package globaldatasource_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/perses/perses/internal/api/authorization"
	databaseFile "github.com/perses/perses/internal/api/database/file"
	globaldatasourceImpl "github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	apiInterface "github.com/perses/perses/internal/api/interface"
	globaldatasourceIface "github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newRealService wires up the real globaldatasource service backed by a
// temporary file-based database. Schema validation is skipped (nil schema) so
// the test does not depend on any loaded plugins.
func newRealService(t *testing.T) globaldatasourceIface.Service {
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

// directURLEntity builds a minimal GlobalDatasource with a valid plugin kind.
// Schema validation is skipped (nil schema in newRealService), so any non-empty
// Kind string satisfies plugin.Plugin.validate() without requiring a real plugin.
func directURLEntity(name string) *v1.GlobalDatasource {
	return &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
		Spec: datasourceSpec.Spec{
			Plugin: plugin.Plugin{Kind: "PrometheusDatasource"},
		},
	}
}

// TestCreateForDiscovery_StampsSource verifies that CreateForDiscovery persists
// the Source field set by the caller and that a subsequent Get returns it intact.
func TestCreateForDiscovery_StampsSource(t *testing.T) {
	svc := newRealService(t)

	entity := directURLEntity("ds-prod")
	entity.Source = &v1.Source{
		Discovery: &v1.DiscoverySource{
			Name: "kube-prod",
			Type: v1.DiscoveryTypeKubernetes,
		},
	}

	created, err := svc.CreateForDiscovery(entity)
	require.NoError(t, err)
	require.NotNil(t, created.Source.GetDiscovery())
	assert.Equal(t, "kube-prod", created.Source.Discovery.Name)
	assert.Equal(t, v1.DiscoveryTypeKubernetes, created.Source.Discovery.Type)

	// Verify the persisted copy also carries the source.
	got, err := svc.Get(apiInterface.Parameters{Name: "ds-prod"})
	require.NoError(t, err)
	require.NotNil(t, got.Source.GetDiscovery())
	assert.Equal(t, "kube-prod", got.Source.Discovery.Name)
}

// TestUpdateForDiscovery_StampsSource verifies that UpdateForDiscovery replaces
// the stored Source with the caller-supplied value (conflict → update path).
func TestUpdateForDiscovery_StampsSource(t *testing.T) {
	svc := newRealService(t)

	// Pre-create without source (simulates a manually-created datasource).
	_, err := svc.Create(nil, directURLEntity("ds-prod"))
	require.NoError(t, err)

	// Discovery now claims it via UpdateForDiscovery.
	updated := directURLEntity("ds-prod")
	updated.Source = &v1.Source{
		Discovery: &v1.DiscoverySource{
			Name: "kube-prod",
			Type: v1.DiscoveryTypeKubernetes,
		},
	}
	_, err = svc.UpdateForDiscovery(updated, apiInterface.Parameters{Name: "ds-prod"})
	require.NoError(t, err)

	got, err := svc.Get(apiInterface.Parameters{Name: "ds-prod"})
	require.NoError(t, err)
	require.NotNil(t, got.Source.GetDiscovery())
	assert.Equal(t, "kube-prod", got.Source.Discovery.Name)
}

// TestCreate_StripsSource verifies that the regular Create path (API/UI/DaC)
// ignores any Source value sent by the client.
func TestCreate_StripsSource(t *testing.T) {
	svc := newRealService(t)

	entity := directURLEntity("ds-manual")
	entity.Source = &v1.Source{
		Discovery: &v1.DiscoverySource{
			Name: "kube-prod",
			Type: v1.DiscoveryTypeKubernetes,
		},
	}

	_, err := svc.Create(nil, entity)
	require.NoError(t, err)

	got, err := svc.Get(apiInterface.Parameters{Name: "ds-manual"})
	require.NoError(t, err)
	assert.Nil(t, got.Source, "Create must strip any client-supplied Source")
}

// TestUpdate_PreservesSource verifies that the regular Update path copies the
// stored Source onto the entity, so editing via API/UI/DaC never drops the
// discovery stamp.
func TestUpdate_PreservesSource(t *testing.T) {
	svc := newRealService(t)

	// Create with a stamped source via the discovery path.
	entity := directURLEntity("ds-prod")
	entity.Source = &v1.Source{
		Discovery: &v1.DiscoverySource{
			Name: "kube-prod",
			Type: v1.DiscoveryTypeKubernetes,
		},
	}
	_, err := svc.CreateForDiscovery(entity)
	require.NoError(t, err)

	// Now update via the regular (API) path — Source should be copied from the stored entity.
	patch := directURLEntity("ds-prod") // no Source field
	_, err = svc.Update(nil, patch, apiInterface.Parameters{Name: "ds-prod"})
	require.NoError(t, err)

	got, err := svc.Get(apiInterface.Parameters{Name: "ds-prod"})
	require.NoError(t, err)
	require.NotNil(t, got.Source.GetDiscovery(), "Update must preserve the discovery source stamp")
	assert.Equal(t, "kube-prod", got.Source.Discovery.Name)
}

func newFilterDS(name string, discoveryName string, discoveryType v1.DiscoveryType) *v1.GlobalDatasource {
	ds := &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
	}
	if discoveryName != "" || discoveryType != "" {
		ds.Source = &v1.Source{
			Discovery: &v1.DiscoverySource{
				Name: discoveryName,
				Type: discoveryType,
			},
		}
	}
	return ds
}

func TestFilterByDiscovery(t *testing.T) {
	all := []*v1.GlobalDatasource{
		newFilterDS("ds-kube-prod-1", "kube-prod", v1.DiscoveryTypeKubernetes),
		newFilterDS("ds-kube-prod-2", "kube-prod", v1.DiscoveryTypeKubernetes),
		newFilterDS("ds-kube-staging", "kube-staging", v1.DiscoveryTypeKubernetes),
		newFilterDS("ds-http-prod", "http-prod", v1.DiscoveryTypeHTTP),
		newFilterDS("ds-manual", "", ""),
	}

	tests := []struct {
		name          string
		query         globaldatasourceIface.Query
		expectedNames []string
	}{
		{
			name:          "no filter returns all",
			query:         globaldatasourceIface.Query{},
			expectedNames: []string{"ds-kube-prod-1", "ds-kube-prod-2", "ds-kube-staging", "ds-http-prod", "ds-manual"},
		},
		{
			name:          "discovery_name=kube-prod",
			query:         globaldatasourceIface.Query{DiscoveryName: "kube-prod"},
			expectedNames: []string{"ds-kube-prod-1", "ds-kube-prod-2"},
		},
		{
			name:          "discovery_name=kube-staging",
			query:         globaldatasourceIface.Query{DiscoveryName: "kube-staging"},
			expectedNames: []string{"ds-kube-staging"},
		},
		{
			name:          "discovery_type=kubernetes only",
			query:         globaldatasourceIface.Query{DiscoveryType: v1.DiscoveryTypeKubernetes},
			expectedNames: []string{"ds-kube-prod-1", "ds-kube-prod-2", "ds-kube-staging"},
		},
		{
			name:          "discovery_type=http only",
			query:         globaldatasourceIface.Query{DiscoveryType: v1.DiscoveryTypeHTTP},
			expectedNames: []string{"ds-http-prod"},
		},
		{
			name:          "discovery_name=kube-prod AND discovery_type=kubernetes",
			query:         globaldatasourceIface.Query{DiscoveryName: "kube-prod", DiscoveryType: v1.DiscoveryTypeKubernetes},
			expectedNames: []string{"ds-kube-prod-1", "ds-kube-prod-2"},
		},
		{
			name:          "discovery_name=kube-prod AND discovery_type=http returns nothing",
			query:         globaldatasourceIface.Query{DiscoveryName: "kube-prod", DiscoveryType: v1.DiscoveryTypeHTTP},
			expectedNames: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var names []string
			for _, ds := range all {
				if tt.query.MatchDiscovery(ds) {
					names = append(names, ds.Metadata.Name)
				}
			}
			if names == nil {
				names = []string{}
			}
			assert.ElementsMatch(t, tt.expectedNames, names)
		})
	}
}

// TestList_UnknownDiscoveryType verifies that a request with an unrecognised
// discovery_type query parameter is rejected with HTTP 400.
func TestList_UnknownDiscoveryType(t *testing.T) {
	svc := newRealService(t)
	authz, err := authorization.New(nil, nil, nil, nil, nil, config.Config{})
	require.NoError(t, err)
	ep := globaldatasourceImpl.NewEndpoint(config.DatasourceConfig{}, svc, authz, false, false)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/globaldatasources?discovery_type=foo", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	listHandler := ep.(interface {
		List(*echo.Context) error
	})
	herr := listHandler.List(ctx)
	require.Error(t, herr)
	assert.True(t, errors.Is(herr, apiInterface.BadRequestError), "expected BadRequestError, got %T: %v", herr, herr)
	var httpErr *echo.HTTPError
	require.True(t, errors.As(apiInterface.HandleError(herr), &httpErr))
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}
