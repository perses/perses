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

package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/project"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// stubProjectService satisfies project.Service by embedding the interface. Only Get can be called by the
// middleware, and it isn't reached by the routes exercised below (they carry no project).
type stubProjectService struct {
	project.Service
}

func (stubProjectService) Get(_ apiInterface.Parameters) (*v1.Project, error) {
	return &v1.Project{}, nil
}

// rawGet sends a GET with the path kept verbatim (so percent-encoding reaches the server as-is) and
// returns the response status code.
func rawGet(t *testing.T, serverURL, path string) int {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, serverURL+path, nil)
	require.NoError(t, err)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
	return resp.StatusCode
}

// TestCheckParameterUserPermissionsUsername ensures that the user permissions endpoint accepts delegated
// authentication usernames (e.g. Kubernetes "kube:admin", percent-encoded as "kube%3Aadmin") while keeping
// the path-traversal protections for that route and for every other route.
func TestCheckParameterUserPermissionsUsername(t *testing.T) {
	e := echo.New()
	// HandleError maps the *PersesError returned on rejection to its HTTP status, as the real server does.
	e.Use(HandleError())
	e.Use(CheckParameter(stubProjectService{}, ""))
	handler := func(c echo.Context) error { return c.NoContent(http.StatusOK) }
	e.GET("/api/v1/users/:name/permissions", handler)
	e.GET("/api/v1/users/:name", handler)
	e.GET("/api/v1/globalvariables/:name", handler)

	server := httptest.NewServer(e)
	defer server.Close()

	tests := []struct {
		name       string
		path       string
		wantStatus int
	}{
		// Happy paths: the permissions endpoint must let valid usernames through to the handler.
		{"encoded k8s username with a colon is allowed", "/api/v1/users/kube%3Aadmin/permissions", http.StatusOK},
		{"long k8s service account username is allowed", "/api/v1/users/system%3Aserviceaccount%3Asome-namespace%3Asome-service-account/permissions", http.StatusOK},
		{"oidc email username is allowed", "/api/v1/users/alice%40corp.com/permissions", http.StatusOK},
		{"plain username is allowed", "/api/v1/users/admin/permissions", http.StatusOK},
		{"username with allowed id characters is allowed", "/api/v1/users/my_User-1.0/permissions", http.StatusOK},

		// Path-traversal attempts on the permissions endpoint must still be rejected.
		{"encoded parent directory is rejected", "/api/v1/users/%2e%2e/permissions", http.StatusBadRequest},
		{"double-encoded parent directory is rejected", "/api/v1/users/%252e%252e/permissions", http.StatusBadRequest},
		{"encoded slash traversal is rejected", "/api/v1/users/..%2Fsecrets/permissions", http.StatusBadRequest},
		{"encoded path separator is rejected", "/api/v1/users/foo%2Fbar/permissions", http.StatusBadRequest},
		{"encoded backslash traversal is rejected", "/api/v1/users/..%5Csecrets/permissions", http.StatusBadRequest},
		{"encoded null byte is rejected", "/api/v1/users/foo%00bar/permissions", http.StatusBadRequest},
		{"contains parent directory is rejected", "/api/v1/users/foo..bar/permissions", http.StatusBadRequest},

		// The colon relaxation is scoped to the permissions endpoint only.
		{"colon is rejected on the plain user route", "/api/v1/users/kube%3Aadmin", http.StatusBadRequest},
		{"colon is rejected on other resources", "/api/v1/globalvariables/kube%3Aadmin", http.StatusBadRequest},
		{"traversal is still rejected on other resources", "/api/v1/globalvariables/%2e%2e", http.StatusBadRequest},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.wantStatus, rawGet(t, server.URL, tc.path))
		})
	}

	// A username longer than the allowed limit must be rejected.
	t.Run("username exceeding the length limit is rejected", func(t *testing.T) {
		tooLong := strings.Repeat("a", 254)
		assert.Equal(t, http.StatusBadRequest, rawGet(t, server.URL, fmt.Sprintf("/api/v1/users/%s/permissions", tooLong)))
	})
}
