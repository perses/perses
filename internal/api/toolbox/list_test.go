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
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/require"
)

type listAuthorization struct {
	authorization.Authorization
}

func (*listAuthorization) IsEnabled() bool {
	return true
}

func (*listAuthorization) HasPermission(_ echo.Context, _ role.Action, _ string, _ role.Scope) bool {
	return true
}

func (*listAuthorization) GetUserProjects(_ echo.Context, _ role.Action, _ role.Scope) ([]string, error) {
	return []string{"project-1", "project-2"}, nil
}

// synchronizedDashboardService parks every list goroutine inside RawList so the
// test can inspect the query objects while both project lists are in flight.
type synchronizedDashboardService struct {
	dashboard.Service
	entered chan *dashboard.Query
	release chan struct{}
}

func (s *synchronizedDashboardService) RawList(query *dashboard.Query) ([]json.RawMessage, error) {
	s.entered <- query
	<-s.release
	// Echo this query's project so the test can check each goroutine listed its
	// own project instead of a shared last-write-wins value.
	result, err := json.Marshal(query.Project)
	return []json.RawMessage{result}, err
}

// TestListAcrossAuthorizedProjects proves each authorized project gets its own
// query copy. listWhenPermissionIsActivated fans out one goroutine per project
// from GetUserProjects. The old code called SetProjectQueryParam on the same
// *dashboard.Query from every goroutine, so the project name raced. The barrier
// waits until both RawList calls are inside the service at once, then checks
// they received different query pointers, left the caller's query untouched,
// and returned both projects.
func TestListAcrossAuthorizedProjects(t *testing.T) {
	service := &synchronizedDashboardService{
		entered: make(chan *dashboard.Query, 2),
		release: make(chan struct{}),
	}
	tb := New[*v1.Dashboard, *v1.Dashboard, *dashboard.Query](service, &listAuthorization{}, v1.KindDashboard, true).(*toolbox[*v1.Dashboard, *v1.Dashboard, *dashboard.Query])
	e := echo.New()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/dashboards", nil), httptest.NewRecorder())
	query := &dashboard.Query{}

	type response struct {
		value any
		err   error
	}
	responseCh := make(chan response, 1)
	go func() {
		value, err := tb.list(ctx, apiInterface.Parameters{}, query)
		responseCh <- response{value: value, err: err}
	}()

	// Wait until both project lists have entered RawList. A shared query would
	// already have been mutated by both goroutines at this point.
	firstQuery := <-service.entered
	secondQuery := <-service.entered
	close(service.release)

	result := <-responseCh
	require.NoError(t, result.err)
	require.NotSame(t, firstQuery, secondQuery)
	require.Empty(t, query.Project)

	projects := make([]string, 0, 2)
	for _, item := range result.value.([]any) {
		var project string
		require.NoError(t, json.Unmarshal(item.(json.RawMessage), &project))
		projects = append(projects, project)
	}
	require.ElementsMatch(t, []string{"project-1", "project-2"}, projects)
}
