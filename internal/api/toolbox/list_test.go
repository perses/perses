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

package toolbox

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/require"
)

type listAuthorization struct {
	authorization.Authorization
	projects []string
}

func (*listAuthorization) IsEnabled() bool {
	return true
}

func (*listAuthorization) HasPermission(_ echo.Context, _ role.Action, _ string, _ role.Scope) bool {
	return true
}

func (a *listAuthorization) GetUserProjects(_ echo.Context, _ role.Action, _ role.Scope) ([]string, error) {
	return a.projects, nil
}

// recordingDashboardService records the projects of every RawList call, and returns one row per project listed.
type recordingDashboardService struct {
	dashboard.Service
	calls [][]string
}

func (s *recordingDashboardService) RawList(query *dashboard.Query) ([]json.RawMessage, error) {
	if len(query.Project) > 0 {
		return nil, errors.New("the project of the query must not be set")
	}
	s.calls = append(s.calls, slices.Clone(query.Projects))
	result := make([]json.RawMessage, 0, len(query.Projects))
	for _, project := range query.Projects {
		row, err := json.Marshal(project)
		if err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}

func listedProjects(t *testing.T, list any) []string {
	t.Helper()
	var projects []string
	switch typedList := list.(type) {
	case []json.RawMessage:
		for _, row := range typedList {
			var project string
			require.NoError(t, json.Unmarshal(row, &project))
			projects = append(projects, project)
		}
	case []any:
		for _, row := range typedList {
			var project string
			require.NoError(t, json.Unmarshal(row.(json.RawMessage), &project))
			projects = append(projects, project)
		}
	default:
		t.Fatalf("unexpected list type %T", list)
	}
	return projects
}

// TestListAcrossAuthorizedProjects checks that the resources of all the authorized projects are listed with a single
// request, instead of one request per project, without modifying the query of the caller.
func TestListAcrossAuthorizedProjects(t *testing.T) {
	authorizedProjects := []string{"project-1", "project-2"}
	service := &recordingDashboardService{}
	tb := New[*v1.Dashboard, *v1.Dashboard, *dashboard.Query](service, &listAuthorization{projects: authorizedProjects}, v1.KindDashboard, true).(*toolbox[*v1.Dashboard, *v1.Dashboard, *dashboard.Query])
	e := echo.New()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/dashboards", nil), httptest.NewRecorder())
	query := &dashboard.Query{}

	result, err := tb.list(ctx, apiInterface.Parameters{}, query)
	require.NoError(t, err)
	require.Equal(t, [][]string{authorizedProjects}, service.calls)
	require.Empty(t, query.Project)
	require.Empty(t, query.Projects)
	require.ElementsMatch(t, authorizedProjects, listedProjects(t, result))
}

// TestListAcrossManyAuthorizedProjects checks that a very large number of authorized projects is split into several
// requests of at most maxProjectsPerListQuery projects, whose results are combined.
func TestListAcrossManyAuthorizedProjects(t *testing.T) {
	authorizedProjects := make([]string, 0, 2*maxProjectsPerListQuery+1)
	for i := range cap(authorizedProjects) {
		authorizedProjects = append(authorizedProjects, fmt.Sprintf("project-%d", i))
	}
	service := &recordingDashboardService{}
	tb := New[*v1.Dashboard, *v1.Dashboard, *dashboard.Query](service, &listAuthorization{projects: authorizedProjects}, v1.KindDashboard, true).(*toolbox[*v1.Dashboard, *v1.Dashboard, *dashboard.Query])
	e := echo.New()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/dashboards", nil), httptest.NewRecorder())

	result, err := tb.list(ctx, apiInterface.Parameters{}, &dashboard.Query{})
	require.NoError(t, err)
	require.Equal(t, [][]string{
		authorizedProjects[:maxProjectsPerListQuery],
		authorizedProjects[maxProjectsPerListQuery : 2*maxProjectsPerListQuery],
		authorizedProjects[2*maxProjectsPerListQuery:],
	}, service.calls)
	require.ElementsMatch(t, authorizedProjects, listedProjects(t, result))
}

// wildcardAuthorization returns the wildcard mixed with a real project, as k8s authz does for a user
// with all-namespace access alongside specific namespaces.
type wildcardAuthorization struct {
	authorization.Authorization
}

func (*wildcardAuthorization) IsEnabled() bool {
	return true
}

func (*wildcardAuthorization) HasPermission(_ echo.Context, _ role.Action, _ string, _ role.Scope) bool {
	return true
}

func (*wildcardAuthorization) GetUserProjects(_ echo.Context, _ role.Action, _ role.Scope) ([]string, error) {
	return []string{v1.WildcardProject, "project-1"}, nil
}

// wildcardRejectingDashboardService mimics the database layer, which rejects the wildcard project as an
// invalid id: if the wildcard ever reaches the query, RawList fails.
type wildcardRejectingDashboardService struct {
	dashboard.Service
}

func (*wildcardRejectingDashboardService) RawList(query *dashboard.Query) ([]json.RawMessage, error) {
	if query.Project == v1.WildcardProject {
		return nil, &databaseModel.Error{Key: query.Project, Code: databaseModel.ErrorBadRequest}
	}
	return []json.RawMessage{}, nil
}

// TestListWithWildcardAmongAuthorizedProjects ensures a wildcard mixed with real projects is treated as
// global access (full list returned) instead of forwarding the literal "*" to the database, which would 500.
func TestListWithWildcardAmongAuthorizedProjects(t *testing.T) {
	tb := New[*v1.Dashboard, *v1.Dashboard, *dashboard.Query](&wildcardRejectingDashboardService{}, &wildcardAuthorization{}, v1.KindDashboard, true).(*toolbox[*v1.Dashboard, *v1.Dashboard, *dashboard.Query])
	e := echo.New()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/dashboards", nil), httptest.NewRecorder())

	_, err := tb.list(ctx, apiInterface.Parameters{}, &dashboard.Query{})
	require.NoError(t, err)
}
