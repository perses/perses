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

//go:build integration

package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	modelAPI "github.com/perses/perses/pkg/model/api"
)

func TestGetSchemaDashboard(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.PersistenceManager) []modelAPI.Entity {
		resp := expect.GET(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, utils.PathSchemas, "dashboard")).
			Expect().
			Status(http.StatusOK)

		resp.Header("Content-Type").Contains("text/x-cue")
		resp.Body().NotEmpty()
		// The base dashboard schema must always expose a #Dashboard definition.
		resp.Body().Contains("#Dashboard")
		return nil
	})
}

func TestGetSchemaPluginList(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.PersistenceManager) []modelAPI.Entity {
		// Without any plugins loaded the endpoint returns an empty JSON object.
		// With plugins loaded it returns CUE text. Both are valid.
		expect.GET(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, utils.PathSchemas, "plugin")).
			Expect().
			Status(http.StatusOK)
		return nil
	})
}

func TestGetSchemaPluginDefinitionNotFound(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.PersistenceManager) []modelAPI.Entity {
		expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathSchemas, "plugin", "NonExistentPlugin")).
			Expect().
			Status(http.StatusNotFound).
			JSON().Object().HasValue("message", "plugin not found")
		return nil
	})
}

func TestGetSchemaPluginDefinitionWithRealPlugins(t *testing.T) {
	// This test uses the default server config, which points at the real plugins directory.
	// It verifies that a known plugin can be fetched as a CUE definition.
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.PersistenceManager) []modelAPI.Entity {
		// Probe the plugin list first so the test does not hard-code a name that
		// might not be installed in all environments.
		listResp := expect.GET(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, utils.PathSchemas, "plugin")).
			Expect().
			Status(http.StatusOK)

		// If no plugins are present the response is the empty JSON object "{}".
		// Only continue when the plugin list is non-empty.
		if listResp.Body().Raw() == "{}" {
			t.Skip("no plugins loaded in this environment, skipping per-plugin definition test")
		}

		// TimeSeriesChart ships with Perses by default; try fetching its definition.
		expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathSchemas, "plugin", "TimeSeriesChart")).
			Expect().
			Status(http.StatusOK).
			Header("Content-Type").Contains("text/x-cue")

		return nil
	})
}
