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
	"github.com/perses/perses/pkg/model/api"
)

// projectScopedListPaths gathers every resource path that can be listed with a `project` filter
// and that is always exposed by the API, regardless of the configuration.
// The `project` value is used by the file database to build a folder path, so it must be strictly validated.
var projectScopedListPaths = []string{
	utils.PathDashboard,
	utils.PathDatasource,
	utils.PathEphemeralDashboard,
	utils.PathFolder,
	utils.PathSecret,
	utils.PathVariable,
}

// authzProjectScopedListPaths gathers the project-scoped resource paths that are only exposed
// when the native authorization provider is enabled.
var authzProjectScopedListPaths = append(projectScopedListPaths, utils.PathRole, utils.PathRoleBinding)

// pathTraversalProjectValues gathers project names that would allow escaping the resource folder
// when using the file database (e.g. `<folder>/variables/..` resolves to `<folder>` and would list the entire database).
// They are passed through WithQuery, so they are URL-encoded by the client and decoded back by the server.
var pathTraversalProjectValues = []string{
	"..",
	".",
	"../..",
	"../../..",
	"./..",
	"../projects",
	"../dashboards",
	"perses/..",
	"perses/../..",
	"/",
	"/etc",
	"..\\..",
	"perses\\..\\..",
	"...",
	".perses",
	"perses.",
	"..perses",
	"perses..",
	"per..ses",
}

// rawEncodedPathTraversalQueryStrings gathers already URL-encoded query strings.
// They are passed as-is to ensure the server does not accept encoded traversal sequences either.
var rawEncodedPathTraversalQueryStrings = []string{
	"project=%2e%2e",
	"project=%2E%2E",
	"project=%2e%2e%2f%2e%2e",
	"project=..%2f..",
	"project=..%5c..",
	"project=%252e%252e",
	"project=%c0%ae%c0%ae",
}

// TestListWithPathTraversalInProjectQueryParam ensures that a path traversal attempt through the `project` query parameter
// is rejected with a bad request for every project-scoped resource, and does not expose the content of the entire database.
func TestListWithPathTraversalInProjectQueryParam(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		firstProject := e2eframework.NewProject("first")
		secondProject := e2eframework.NewProject("second")
		firstVariable := e2eframework.NewVariable(firstProject.Metadata.Name, "var-1")
		secondVariable := e2eframework.NewVariable(secondProject.Metadata.Name, "var-2")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), firstProject, secondProject, firstVariable, secondVariable)

		// Sanity checks: the database contains resources spread across several projects,
		// and a legitimate project filter returns only the resources of that project.
		expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathVariable)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(2)

		expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathVariable)).
			WithQuery("project", firstProject.Metadata.Name).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(1)

		for _, path := range projectScopedListPaths {
			for _, project := range pathTraversalProjectValues {
				expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
					WithQuery("project", project).
					Expect().
					Status(http.StatusBadRequest)
			}
			for _, rawQuery := range rawEncodedPathTraversalQueryStrings {
				expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
					WithQueryString(rawQuery).
					Expect().
					Status(http.StatusBadRequest)
			}
		}

		return []api.Entity{firstProject, secondProject, firstVariable, secondVariable}
	})
}

// TestListWithPathTraversalInProjectQueryParamWithMetadataOnly ensures the validation of the `project` query parameter
// is also applied when requesting only the metadata of the resources.
func TestListWithPathTraversalInProjectQueryParamWithMetadataOnly(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "var")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable)

		for _, path := range projectScopedListPaths {
			for _, projectValue := range pathTraversalProjectValues {
				expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
					WithQuery("project", projectValue).
					WithQuery("metadata_only", true).
					Expect().
					Status(http.StatusBadRequest)
			}
		}

		return []api.Entity{project, variable}
	})
}

// TestListWithPathTraversalInProjectPathParam ensures that a path traversal attempt through the `project` path parameter
// (e.g. /api/v1/projects/../variables) is never answered with a listing.
func TestListWithPathTraversalInProjectPathParam(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "var")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable)

		// Already URL-encoded to bypass any client-side path cleaning and reach the router as a single path segment.
		encodedProjects := []string{
			"%2e%2e",
			"%2E%2E",
			"%2e",
			"%2e%2e%2f%2e%2e",
			"..%2f..",
			"..%5c..",
			"perses%2f..",
		}

		for _, path := range projectScopedListPaths {
			for _, encodedProject := range encodedProjects {
				expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, encodedProject, path)).
					Expect().
					Status(http.StatusBadRequest)
			}
		}

		return []api.Entity{project, variable}
	})
}

// TestListWithPathTraversalInProjectQueryParamAndPathParamMismatch ensures that providing a valid project in the path
// while trying to traverse through the query parameter is rejected.
func TestListWithPathTraversalInProjectQueryParamAndPathParamMismatch(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "var")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable)

		for _, path := range projectScopedListPaths {
			for _, projectValue := range pathTraversalProjectValues {
				expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, project.Metadata.Name, path)).
					WithQuery("project", projectValue).
					Expect().
					Status(http.StatusBadRequest)
			}
		}

		return []api.Entity{project, variable}
	})
}

// TestAuthListWithPathTraversalInProjectQueryParam ensures that the validation of the `project` query parameter
// is done before any permission-based filtering when the authentication/authorization is enabled.
func TestAuthListWithPathTraversalInProjectQueryParam(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []api.Entity {
		firstProject := e2eframework.NewProject("first")
		secondProject := e2eframework.NewProject("second")
		firstVariable := e2eframework.NewVariable(firstProject.Metadata.Name, "var-1")
		secondVariable := e2eframework.NewVariable(secondProject.Metadata.Name, "var-2")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), firstProject, secondProject, firstVariable, secondVariable)

		headerName, headerValue := e2eframework.CreateAuthorizationHeader(token)

		// Sanity check: the authenticated user (global admin) can see everything with a legitimate request.
		expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathVariable)).
			WithHeader(headerName, headerValue).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(2)

		for _, path := range authzProjectScopedListPaths {
			for _, projectValue := range pathTraversalProjectValues {
				expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
					WithHeader(headerName, headerValue).
					WithQuery("project", projectValue).
					Expect().
					Status(http.StatusBadRequest)
			}
			for _, rawQuery := range rawEncodedPathTraversalQueryStrings {
				expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
					WithHeader(headerName, headerValue).
					WithQueryString(rawQuery).
					Expect().
					Status(http.StatusBadRequest)
			}
		}

		return []api.Entity{firstProject, secondProject, firstVariable, secondVariable}
	})
}
