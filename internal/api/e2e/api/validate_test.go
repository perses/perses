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
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	testUtils "github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

// loadRawDashboard reads the testdata dashboard as raw JSON.
// Working on raw JSON rather than the typed modelV1.Dashboard struct is required to be able to inject
// malicious values in the metadata (name / project): the typed struct would reject them at unmarshalling
// time on the client side, before they even reach the server.
func loadRawDashboard(t *testing.T) []byte {
	dash := testUtils.ReadFile(filepath.Join("testdata", "dashboard.json"))
	if !gjson.ValidBytes(dash) {
		t.Fatal("testdata dashboard is not a valid JSON document")
	}
	if !gjson.GetBytes(dash, "metadata").IsObject() {
		t.Fatal("testdata dashboard does not contain a metadata object")
	}
	return dash
}

// setRawDashboardValue sets the given value at the given gjson/sjson path (e.g. "metadata.project") in the raw dashboard.
func setRawDashboardValue(t *testing.T, dash []byte, path string, value any) []byte {
	result, err := sjson.SetBytes(dash, path, value)
	if err != nil {
		t.Fatalf("unable to set %q in the raw dashboard: %v", path, err)
	}
	return result
}

func validateDashboardPath() string {
	return fmt.Sprintf("%s/validate/%s", utils.APIPrefix, utils.PathDashboard)
}

func TestValidateDashboardEndpoint(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []modelAPI.Entity {
		var dash modelV1.Dashboard
		testUtils.JSONUnmarshalFromFile(filepath.Join("testdata", "dashboard.json"), &dash)

		expect.POST(validateDashboardPath()).
			WithJSON(dash).
			Expect().
			Status(http.StatusOK)
		return []modelAPI.Entity{}
	})
}

func TestValidateDashboardEndpoint_WithGeneratedDashboard(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []modelAPI.Entity {
		dash := e2eframework.NewDashboard(t, "perses", "myDashboard")

		expect.POST(validateDashboardPath()).
			WithJSON(dash).
			Expect().
			Status(http.StatusOK)
		return []modelAPI.Entity{}
	})
}

func TestValidateDashboardEndpoint_InvalidBody(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []modelAPI.Entity {
		expect.POST(validateDashboardPath()).
			WithBytes([]byte(`{"kind": "Dashboard", "metadata": {`)).
			WithHeader("Content-Type", "application/json").
			Expect().
			Status(http.StatusBadRequest)
		return []modelAPI.Entity{}
	})
}

func TestValidateDashboardEndpoint_InvalidVariableName(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []modelAPI.Entity {
		dash := loadRawDashboard(t)
		// A variable using the builtin prefix "__" must be rejected by the spec validation.
		dash = setRawDashboardValue(t, dash, "spec.variables", []map[string]any{
			{
				"kind": "TextVariable",
				"spec": map[string]any{
					"name":  "__forbidden",
					"value": "foo",
				},
			},
		})

		expect.POST(validateDashboardPath()).
			WithBytes(dash).
			WithHeader("Content-Type", "application/json").
			Expect().
			Status(http.StatusBadRequest).
			JSON().Object().Value("message").String().Contains("builtin variable prefix")
		return []modelAPI.Entity{}
	})
}

// TestValidateDashboardEndpoint_PathTraversal ensures that a dashboard whose `metadata.project`
// (or `metadata.name`) contains a path-like value is rejected, so that it cannot be used to escape the
// directory a resource is supposed to be stored in when the file database is in use.
func TestValidateDashboardEndpoint_PathTraversal(t *testing.T) {
	testSuite := []struct {
		title           string
		path            string
		value           string
		expectedMessage string
	}{
		{
			title:           "project with relative path traversal",
			path:            "metadata.project",
			value:           "../../etc",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "project with relative path traversal using backslash",
			path:            "metadata.project",
			value:           `..\..\etc`,
			expectedMessage: "is not a correct name",
		},
		{
			title:           "project with absolute path",
			path:            "metadata.project",
			value:           "/etc/passwd",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "project with sub-directory",
			path:            "metadata.project",
			value:           "perses/other",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "project with URL encoded path traversal",
			path:            "metadata.project",
			value:           "..%2F..%2Fetc",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "project is only double dot",
			path:            "metadata.project",
			value:           "..",
			expectedMessage: "should not contain '..'",
		},
		{
			title:           "project contains double dot",
			path:            "metadata.project",
			value:           "perses..other",
			expectedMessage: "should not contain '..'",
		},
		{
			title:           "project is only a single dot",
			path:            "metadata.project",
			value:           ".",
			expectedMessage: "should not start or end with '.'",
		},
		{
			title:           "project starting with a dot",
			path:            "metadata.project",
			value:           ".hidden",
			expectedMessage: "should not start or end with '.'",
		},
		{
			title:           "project ending with a dot",
			path:            "metadata.project",
			value:           "perses.",
			expectedMessage: "should not start or end with '.'",
		},
		{
			title:           "project with null byte",
			path:            "metadata.project",
			value:           "perses\u0000",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "name with relative path traversal",
			path:            "metadata.name",
			value:           "../../etc/passwd",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "name with sub-directory",
			path:            "metadata.name",
			value:           "myDashboard/other",
			expectedMessage: "is not a correct name",
		},
		{
			title:           "name is only double dot",
			path:            "metadata.name",
			value:           "..",
			expectedMessage: "should not contain '..'",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []modelAPI.Entity {
				dash := setRawDashboardValue(t, loadRawDashboard(t), test.path, test.value)

				expect.POST(validateDashboardPath()).
					WithBytes(dash).
					WithHeader("Content-Type", "application/json").
					Expect().
					Status(http.StatusBadRequest).
					JSON().Object().Value("message").String().Contains(test.expectedMessage)
				return []modelAPI.Entity{}
			})
		})
	}
}

// TestValidateDashboardEndpoint_ValidProjectNames ensures that legitimate project names containing
// characters allowed by the ID regexp (dots in the middle, dashes, underscores) are still accepted.
func TestValidateDashboardEndpoint_ValidProjectNames(t *testing.T) {
	validProjects := []string{
		"perses",
		"my-project",
		"my_project",
		"my.project",
		"MyProject123",
	}

	for _, project := range validProjects {
		t.Run(project, func(t *testing.T) {
			e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager) []modelAPI.Entity {
				dash := setRawDashboardValue(t, loadRawDashboard(t), "metadata.project", project)

				expect.POST(validateDashboardPath()).
					WithBytes(dash).
					WithHeader("Content-Type", "application/json").
					Expect().
					Status(http.StatusOK)
				return []modelAPI.Entity{}
			})
		})
	}
}
