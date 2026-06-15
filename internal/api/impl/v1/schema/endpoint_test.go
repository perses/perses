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

package schema

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	pluginpkg "github.com/perses/perses/internal/api/plugin"
	pluginmigrate "github.com/perses/perses/internal/api/plugin/migrate"
	pluginschema "github.com/perses/perses/internal/api/plugin/schema"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/module"
	specPlugin "github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// schema stub

// stubSchema implements pluginschema.Schema with controllable responses.
type stubSchema struct {
	pluginschema.Schema
	allSchemas  []pluginschema.LoadSchema
	kindSchemas map[specPlugin.Kind][]pluginschema.LoadSchema
}

func (s *stubSchema) GetAllSchemas() []pluginschema.LoadSchema { return s.allSchemas }

func (s *stubSchema) GetSchemas(kind specPlugin.Kind) []pluginschema.LoadSchema {
	if s.kindSchemas != nil {
		return s.kindSchemas[kind]
	}
	return nil
}

// plugin service stub

// stubPluginService implements the pluginpkg.Plugin interface minimally.
type stubPluginService struct {
	pluginpkg.Plugin
	sch pluginschema.Schema
}

func (s *stubPluginService) Schema() pluginschema.Schema                    { return s.sch }
func (s *stubPluginService) Migration() pluginmigrate.Migration             { return nil }
func (s *stubPluginService) Load() error                                    { return nil }
func (s *stubPluginService) LoadDevPlugin(_ []v1.PluginInDevelopment) error { return nil }
func (s *stubPluginService) RefreshDevPlugin(_ module.Metadata) error       { return nil }
func (s *stubPluginService) UnLoadDevPlugin(_ module.Metadata) error        { return nil }
func (s *stubPluginService) List() ([]byte, error)                          { return []byte("[]"), nil }
func (s *stubPluginService) UnzipArchives() error                           { return nil }
func (s *stubPluginService) GetLoadedPlugin(_, _, _ string) (*pluginpkg.Loaded, bool) {
	return nil, false
}

// helpers

func newEchoContext(t *testing.T, path string) (echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec), rec
}

func newEndpointWithSchemas(schemas []pluginschema.LoadSchema) *endpoint {
	return &endpoint{
		pluginSvc: &stubPluginService{
			sch: &stubSchema{allSchemas: schemas},
		},
		readonly: true,
	}
}

// DashboardSchema tests

func TestDashboardSchemaWithNoPlugins(t *testing.T) {
	ep := newEndpointWithSchemas(nil)
	ctx, rec := newEchoContext(t, "/api/v1/schemas/dashboards")

	err := ep.DashboardSchema(ctx)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Header().Get("Content-Type"), "text/x-cue")
	assert.NotEmpty(t, rec.Body.Bytes())
}

// PluginList tests

func TestPluginListWithNoSchemas(t *testing.T) {
	ep := newEndpointWithSchemas(nil)
	ctx, rec := newEchoContext(t, "/api/v1/schemas/plugins")

	err := ep.PluginList(ctx)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "{}", rec.Body.String())
}

// PluginDefinition tests

func TestPluginDefinitionWithNoSchemas(t *testing.T) {
	ep := newEndpointWithSchemas(nil)
	ctx, rec := newEchoContext(t, "/api/v1/schemas/plugins/AnyPlugin")
	ctx.SetParamNames("pluginName")
	ctx.SetParamValues("AnyPlugin")

	err := ep.PluginDefinition(ctx)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "{}", rec.Body.String())
}

func TestPluginDefinitionPluginDoesNotExist(t *testing.T) {
	// Schemas are present but the requested name does not match any.
	name, instance, loadErr := pluginschema.LoadModelSchema("../../../plugin/schema/testdata/schemas/panels/first")
	require.NoError(t, loadErr)
	schemas := []pluginschema.LoadSchema{{Kind: specPlugin.KindPanel, Name: name, Instance: instance}}

	ep := newEndpointWithSchemas(schemas)
	ctx, rec := newEchoContext(t, "/api/v1/schemas/plugins/NonExistent")
	ctx.SetParamNames("pluginName")
	ctx.SetParamValues("NonExistent")

	err := ep.PluginDefinition(ctx)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "plugin not found")
}

func TestPluginDefinitionPluginExists(t *testing.T) {
	// The schema is registered as "FirstChart"; querying "firstchart" must still match
	// because PluginDefinition uses strings.EqualFold for name comparison.
	name, instance, loadErr := pluginschema.LoadModelSchema("../../../plugin/schema/testdata/schemas/panels/first")
	require.NoError(t, loadErr)
	schemas := []pluginschema.LoadSchema{{Kind: specPlugin.KindPanel, Name: name, Instance: instance}}

	ep := newEndpointWithSchemas(schemas)
	ctx, rec := newEchoContext(t, "/api/v1/schemas/plugins/firstchart")
	ctx.SetParamNames("pluginName")
	ctx.SetParamValues("firstchart")

	err := ep.PluginDefinition(ctx)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Header().Get("Content-Type"), "text/x-cue")
}
