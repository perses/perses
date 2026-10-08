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
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/stretchr/testify/assert"
)

const (
	invalidProjectErrorMessage = "the project name is invalid"
	invalidNameErrorMessage    = "the name is invalid"
)

// globalResourcePathList is the list of the resource paths that are NOT part of a project.
// They are exposed as /api/v1/<resource>/:name and so the `name` path parameter must be validated as well.
var globalResourcePathList = []string{
	utils.PathProject, utils.PathUser, utils.PathGlobalDatasource, utils.PathGlobalRole, utils.PathGlobalRoleBinding, utils.PathGlobalSecret, utils.PathGlobalVariable,
}

// invalidIDs is a list of IDs (project name or resource name) that must be rejected by the CheckParameter middleware.
// They are either path traversal attempts or names that don't match the ID format expected by Perses.
// `raw` is the value used in the HTTP path (kept verbatim, no extra encoding), `decoded` is the value used in a JSON body.
var invalidIDs = []struct {
	name    string
	raw     string
	decoded string
}{
	{name: "parent directory", raw: "..", decoded: ".."},
	{name: "url-encoded parent directory", raw: "%2e%2e", decoded: ".."},
	{name: "double url-encoded parent directory", raw: "%252e%252e", decoded: "%2e%2e"},
	{name: "traversal with sub path", raw: "..%2Fvariables", decoded: "../variables"},
	{name: "traversal with encoded backslash", raw: "..%5Cvariables", decoded: "..\\variables"},
	{name: "current directory", raw: ".", decoded: "."},
	{name: "leading dot", raw: ".hidden", decoded: ".hidden"},
	{name: "trailing dot", raw: "trailing.", decoded: "trailing."},
	{name: "contains parent directory", raw: "foo..bar", decoded: "foo..bar"},
	{name: "url-encoded slash", raw: "foo%2Fbar", decoded: "foo/bar"},
	{name: "forbidden characters", raw: "foo$bar", decoded: "foo$bar"},
	{name: "whitespace", raw: "foo%20bar", decoded: "foo bar"},
	{name: "null byte", raw: "foo%00bar", decoded: "foo\x00bar"},
}

// rawRequest builds a request where the path is sent verbatim to the server.
// httpexpect (and then the Go HTTP client) would otherwise re-encode the '%' contained in the path,
// which would defeat the purpose of testing URL-encoded path traversal attempts.
func rawRequest(server *httptest.Server, expect *httpexpect.Expect, token string, method string, path string) *httpexpect.Request {
	return expect.Request(method, "").
		WithName(fmt.Sprintf("%s %s", method, path)).
		WithURL(server.URL + path).
		WithHeader(e2eframework.CreateAuthorizationHeader(token))
}

func expectInvalidProject(req *httpexpect.Request) {
	req.Expect().
		Status(http.StatusBadRequest).
		JSON().Object().Value("message").String().Contains(invalidProjectErrorMessage)
}

func expectInvalidName(req *httpexpect.Request) {
	req.Expect().
		Status(http.StatusBadRequest).
		JSON().Object().Value("message").String().Contains(invalidNameErrorMessage)
}

// TestCheckParameterMiddlewarePathTraversalInPath ensures that any project name coming from the HTTP path
// is validated for every HTTP method (GET, POST, PUT, DELETE) and for every resource that belongs to a project.
// Before the fix, only GET and POST were verifying the project, allowing path traversal attacks on PUT / DELETE like:
// DELETE /api/v1/projects/../variables/anyVariableName
func TestCheckParameterMiddlewarePathTraversalInPath(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []modelAPI.Entity {
		// Create a legit resource that an attacker could try to reach through a path traversal.
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "targetVariable")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable)

		for _, tc := range invalidIDs {
			for _, resourcePath := range utils.ProjectResourcePathList {
				listURL := fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, tc.raw, resourcePath)
				resourceURL := fmt.Sprintf("%s/%s", listURL, variable.Metadata.Name)

				expectInvalidProject(rawRequest(server, expect, token, http.MethodGet, listURL))
				expectInvalidProject(rawRequest(server, expect, token, http.MethodGet, resourceURL))
				expectInvalidProject(rawRequest(server, expect, token, http.MethodPost, listURL).WithJSON(variable))
				expectInvalidProject(rawRequest(server, expect, token, http.MethodPut, resourceURL).WithJSON(variable))
				expectInvalidProject(rawRequest(server, expect, token, http.MethodDelete, resourceURL))
			}
		}

		// The target resource must still exist: none of the requests above should have been able to reach it.
		_, err := manager.Persistence().GetVariable().Get(project.Metadata.Name, variable.Metadata.Name)
		assert.NoError(t, err)

		return []modelAPI.Entity{project, variable}
	})
}

// TestCheckParameterMiddlewareInvalidNameOnGlobalResources ensures that the `name` path parameter is validated
// for every resource that is NOT part of a project (projects, users, global*), and for every HTTP method that uses it (GET, PUT, DELETE).
// Before the fix, the name was never validated, so the command
// `curl -XDELETE --path-as-is http://localhost:8080/api/v1/projects/..` was deleting the entire database
// as the "project" `..` was resolved to the root folder of the file database.
func TestCheckParameterMiddlewareInvalidNameOnGlobalResources(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []modelAPI.Entity {
		// Create a bunch of resources to be sure nothing is deleted by the requests below.
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "targetVariable")
		globalVariable := e2eframework.NewGlobalVariable("targetGlobalVariable")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable, globalVariable)

		for _, tc := range invalidIDs {
			for _, resourcePath := range globalResourcePathList {
				resourceURL := fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, resourcePath, tc.raw)

				expectInvalidName(rawRequest(server, expect, token, http.MethodGet, resourceURL))
				expectInvalidName(rawRequest(server, expect, token, http.MethodPut, resourceURL).WithJSON(project))
				expectInvalidName(rawRequest(server, expect, token, http.MethodDelete, resourceURL))
			}
		}

		// Nothing should have been deleted.
		_, err := manager.Persistence().GetProject().Get(project.Metadata.Name)
		assert.NoError(t, err)
		_, err = manager.Persistence().GetVariable().Get(project.Metadata.Name, variable.Metadata.Name)
		assert.NoError(t, err)
		_, err = manager.Persistence().GetGlobalVariable().Get(globalVariable.Metadata.Name)
		assert.NoError(t, err)

		return []modelAPI.Entity{project, variable, globalVariable}
	})
}

// TestCheckParameterMiddlewareInvalidNameOnProjectResources ensures that the `name` path parameter is validated
// for every resource that belongs to a project, even when the project name itself is valid and exists.
// e.g. DELETE /api/v1/projects/perses/variables/.. must be rejected.
func TestCheckParameterMiddlewareInvalidNameOnProjectResources(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []modelAPI.Entity {
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "targetVariable")
		dashboard := e2eframework.NewDashboard(t, project.Metadata.Name, "targetDashboard")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable, dashboard)

		for _, tc := range invalidIDs {
			for _, resourcePath := range utils.ProjectResourcePathList {
				resourceURL := fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, project.Metadata.Name, resourcePath, tc.raw)

				expectInvalidName(rawRequest(server, expect, token, http.MethodGet, resourceURL))
				expectInvalidName(rawRequest(server, expect, token, http.MethodPut, resourceURL).WithJSON(variable))
				expectInvalidName(rawRequest(server, expect, token, http.MethodDelete, resourceURL))
			}
		}

		// Nothing should have been deleted.
		_, err := manager.Persistence().GetProject().Get(project.Metadata.Name)
		assert.NoError(t, err)
		_, err = manager.Persistence().GetVariable().Get(project.Metadata.Name, variable.Metadata.Name)
		assert.NoError(t, err)
		_, err = manager.Persistence().GetDashboard().Get(project.Metadata.Name, dashboard.Metadata.Name)
		assert.NoError(t, err)

		return []modelAPI.Entity{project, variable, dashboard}
	})
}

// TestCheckParameterMiddlewareInvalidProjectAndName ensures that when both the project and the name are invalid,
// the request is rejected. The name is checked first by the middleware, so the error message must be about the name.
func TestCheckParameterMiddlewareInvalidProjectAndName(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []modelAPI.Entity {
		project := e2eframework.NewProject("perses")
		variable := e2eframework.NewVariable(project.Metadata.Name, "targetVariable")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), project, variable)

		for _, tc := range invalidIDs {
			for _, resourcePath := range utils.ProjectResourcePathList {
				resourceURL := fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, tc.raw, resourcePath, tc.raw)

				expectInvalidName(rawRequest(server, expect, token, http.MethodGet, resourceURL))
				expectInvalidName(rawRequest(server, expect, token, http.MethodPut, resourceURL).WithJSON(variable))
				expectInvalidName(rawRequest(server, expect, token, http.MethodDelete, resourceURL))
			}
		}

		_, err := manager.Persistence().GetVariable().Get(project.Metadata.Name, variable.Metadata.Name)
		assert.NoError(t, err)

		return []modelAPI.Entity{project, variable}
	})
}

// TestCheckParameterMiddlewareValidNameOnGlobalResources is the happy path for the name check on global resources:
// a valid name must not be rejected by the middleware whatever the HTTP method used.
func TestCheckParameterMiddlewareValidNameOnGlobalResources(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager, token string) []modelAPI.Entity {
		// A name using every allowed character class: letters, digits, '_', '-', and a '.' in the middle.
		globalVariable := e2eframework.NewGlobalVariable("my_Global-Variable.1")
		listURL := fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathGlobalVariable)
		resourceURL := fmt.Sprintf("%s/%s", listURL, globalVariable.Metadata.Name)

		rawRequest(server, expect, token, http.MethodPost, listURL).
			WithJSON(globalVariable).
			Expect().
			Status(http.StatusOK)
		// Let the DB catch up before reading / deleting the resource.
		time.Sleep(3 * time.Second)
		rawRequest(server, expect, token, http.MethodGet, resourceURL).
			Expect().
			Status(http.StatusOK)
		rawRequest(server, expect, token, http.MethodPut, resourceURL).
			WithJSON(globalVariable).
			Expect().
			Status(http.StatusOK)
		rawRequest(server, expect, token, http.MethodDelete, resourceURL).
			Expect().
			Status(http.StatusNoContent)

		return []modelAPI.Entity{}
	})
}

// TestCheckParameterMiddlewareUserPermissionsUsername ensures the permissions endpoint accepts percent-encoded
// delegated usernames (e.g. Kubernetes "kube:admin") while still rejecting path traversal attempts.
func TestCheckParameterMiddlewareUserPermissionsUsername(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager, token string) []modelAPI.Entity {
		// The authenticated user is "alice": requesting her own permissions must succeed.
		rawRequest(server, expect, token, http.MethodGet, fmt.Sprintf("%s/%s/alice/%s", utils.APIV1Prefix, utils.PathUser, utils.PathPermissions)).
			Expect().
			Status(http.StatusOK)

		// A 403 (not a 400 "the name is invalid") proves the encoded username passed the middleware and
		// reached the handler, which rejects it only because it isn't alice's own username.
		rawRequest(server, expect, token, http.MethodGet, fmt.Sprintf("%s/%s/kube%%3Aadmin/%s", utils.APIV1Prefix, utils.PathUser, utils.PathPermissions)).
			Expect().
			Status(http.StatusForbidden)

		// Path traversal attempts on the permissions endpoint must still be rejected by the middleware.
		for _, tc := range invalidIDs {
			expectInvalidName(rawRequest(server, expect, token, http.MethodGet, fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathUser, tc.raw, utils.PathPermissions)))
		}

		return []modelAPI.Entity{}
	})
}

// TestCheckParameterMiddlewareInvalidProjectInBody ensures that when a resource is created through the root endpoint
// (e.g. POST /api/v1/variables), the project name extracted from the body is validated as well.
func TestCheckParameterMiddlewareInvalidProjectInBody(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager, token string) []modelAPI.Entity {
		for _, tc := range invalidIDs {
			for _, resourcePath := range utils.ProjectResourcePathList {
				// The body is only partially decoded by the middleware to extract the project name,
				// so a partial object is enough here. The middleware must reject the request before reaching the handler.
				body := map[string]interface{}{
					"metadata": map[string]interface{}{
						"name":    "myResource",
						"project": tc.decoded,
					},
				}
				expectInvalidProject(
					rawRequest(server, expect, token, http.MethodPost, fmt.Sprintf("%s/%s", utils.APIV1Prefix, resourcePath)).
						WithName(fmt.Sprintf("POST %s with project %q in body", resourcePath, tc.decoded)).
						WithJSON(body),
				)
			}
		}

		// Empty project in the body.
		for _, resourcePath := range utils.ProjectResourcePathList {
			body := map[string]interface{}{
				"metadata": map[string]interface{}{
					"name": "myResource",
				},
			}
			rawRequest(server, expect, token, http.MethodPost, fmt.Sprintf("%s/%s", utils.APIV1Prefix, resourcePath)).
				WithJSON(body).
				Expect().
				Status(http.StatusBadRequest).
				JSON().Object().Value("message").String().Contains("metadata.project cannot be empty")
		}

		// Malformed body.
		for _, resourcePath := range utils.ProjectResourcePathList {
			rawRequest(server, expect, token, http.MethodPost, fmt.Sprintf("%s/%s", utils.APIV1Prefix, resourcePath)).
				WithHeader("Content-Type", "application/json").
				WithBytes([]byte(`{"metadata": {"project": `)).
				Expect().
				Status(http.StatusBadRequest)
		}

		return []modelAPI.Entity{}
	})
}

// TestCheckProjectMiddlewareNotExistingProject ensures that a valid but not existing project name is rejected
// on GET and POST (the only methods for which the project's existence is verified),
// while PUT and DELETE are passed through to the handler that returns a 404 as the resource can't exist.
func TestCheckParameterMiddlewareNotExistingProject(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager, token string) []modelAPI.Entity {
		projectName := "not-existing-project"
		variable := e2eframework.NewVariable(projectName, "myVariable")
		listURL := fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, projectName, utils.PathVariable)
		resourceURL := fmt.Sprintf("%s/%s", listURL, variable.Metadata.Name)

		rawRequest(server, expect, token, http.MethodGet, listURL).
			Expect().
			Status(http.StatusBadRequest).
			JSON().Object().Value("message").String().Contains(projectName)
		rawRequest(server, expect, token, http.MethodGet, resourceURL).
			Expect().
			Status(http.StatusBadRequest).
			JSON().Object().Value("message").String().Contains(projectName)
		rawRequest(server, expect, token, http.MethodPost, listURL).
			WithJSON(variable).
			Expect().
			Status(http.StatusBadRequest).
			JSON().Object().Value("message").String().Contains(projectName)
		rawRequest(server, expect, token, http.MethodPost, fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathVariable)).
			WithJSON(variable).
			Expect().
			Status(http.StatusBadRequest).
			JSON().Object().Value("message").String().Contains(projectName)
		rawRequest(server, expect, token, http.MethodPut, resourceURL).
			WithJSON(variable).
			Expect().
			Status(http.StatusNotFound)
		rawRequest(server, expect, token, http.MethodDelete, resourceURL).
			Expect().
			Status(http.StatusNotFound)

		return []modelAPI.Entity{}
	})
}

// TestCheckParameterMiddlewareValidProject is the happy path: a valid project name must not be rejected by the middleware
// whatever the HTTP method used.
func TestCheckParameterMiddlewareValidProject(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []modelAPI.Entity {
		// A name using every allowed character class: letters, digits, '_', '-', and a '.' in the middle.
		project := e2eframework.NewProject("my_Project-1.0")
		variable := e2eframework.NewVariable(project.Metadata.Name, "myVariable")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), project)

		listURL := fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, project.Metadata.Name, utils.PathVariable)
		resourceURL := fmt.Sprintf("%s/%s", listURL, variable.Metadata.Name)

		rawRequest(server, expect, token, http.MethodPost, listURL).
			WithJSON(variable).
			Expect().
			Status(http.StatusOK)
		// Let the DB catch up before reading / deleting the resource.
		time.Sleep(3 * time.Second)
		rawRequest(server, expect, token, http.MethodGet, listURL).
			Expect().
			Status(http.StatusOK)
		rawRequest(server, expect, token, http.MethodGet, resourceURL).
			Expect().
			Status(http.StatusOK)
		rawRequest(server, expect, token, http.MethodPut, resourceURL).
			WithJSON(variable).
			Expect().
			Status(http.StatusOK)
		rawRequest(server, expect, token, http.MethodDelete, resourceURL).
			Expect().
			Status(http.StatusNoContent)

		return []modelAPI.Entity{project}
	})
}
