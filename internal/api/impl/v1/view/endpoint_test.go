// Copyright 2024 The Perses Authors
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

package view

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4/middleware"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/pkg/model/api"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	promclient "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var _ = authorization.Authorization(&testRBAC{})
var _ = dashboard.Service(&mockDashboardService{})

type testRBAC struct {
	allow bool
}

func (t *testRBAC) GetUser(_ echo.Context) (any, error) {
	return nil, nil
}

func (t *testRBAC) GetUsername(_ echo.Context) (string, error) {
	return "", nil
}

func (t *testRBAC) Middleware(_ middleware.Skipper) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			return next(c)
		}
	}
}

func (t *testRBAC) GetPermissions(_ echo.Context) (map[string][]*role.Permission, error) {
	return map[string][]*role.Permission{}, nil
}

func (t *testRBAC) HasPermission(_ echo.Context, _ role.Action, _ string, _ role.Scope) bool {
	return t.allow
}

func (t *testRBAC) IsEnabled() bool {
	return true
}

func (t *testRBAC) RefreshPermissions() error {
	return nil
}

func (t *testRBAC) GetUserProjects(_ echo.Context, _ role.Action, _ role.Scope) ([]string, error) {
	panic("unimplemented")
}

type mockDashboardService struct {
	dashboard *v1.Dashboard
}

func (*mockDashboardService) Validate(_ *v1.Dashboard) error {
	panic("unimplemented")
}

func (*mockDashboardService) Create(_ echo.Context, _ *v1.Dashboard) (*v1.Dashboard, error) {
	panic("unimplemented")
}

func (*mockDashboardService) Update(_ echo.Context, _ *v1.Dashboard, _ apiInterface.Parameters) (*v1.Dashboard, error) {
	panic("unimplemented")
}

func (*mockDashboardService) Delete(_ echo.Context, _ apiInterface.Parameters) error {
	panic("unimplemented")
}

func (m *mockDashboardService) Get(_ apiInterface.Parameters) (*v1.Dashboard, error) {
	if m.dashboard != nil {
		return m.dashboard, nil
	}

	return nil, fmt.Errorf("not found")
}

func (*mockDashboardService) List(_ *dashboard.Query, _ apiInterface.Parameters) ([]*v1.Dashboard, error) {
	panic("unimplemented")
}

func (*mockDashboardService) RawList(_ *dashboard.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	panic("unimplemented")
}

func (*mockDashboardService) MetadataList(_ *dashboard.Query, _ apiInterface.Parameters) ([]api.Entity, error) {
	panic("unimplemented")
}

func (*mockDashboardService) RawMetadataList(_ *dashboard.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	panic("unimplemented")
}

func TestEndpoint(t *testing.T) {
	endpoint := NewEndpoint(NewMetricsViewService(), &testRBAC{true}, &mockDashboardService{&v1.Dashboard{}}).(*endpoint)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/view", strings.NewReader(`{"project":"project","dashboard":"dashboard", "render_errors":2, "render_time_secs":1.7}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user", &jwt.Token{
		Claims: &jwt.RegisteredClaims{},
	})

	err := endpoint.view(ctx)
	require.NoError(t, err)

	metric := promclient.Metric{}
	count, err := dashboardViewCounter.GetMetricWithLabelValues("project", "dashboard")
	require.NoError(t, err)
	require.NoError(t, count.Write(&metric))
	assert.Equal(t, 1.0, *metric.Counter.Value)

	count, err = dashboardRenderErrorCounter.GetMetricWithLabelValues("project", "dashboard")
	require.NoError(t, err)
	require.NoError(t, count.Write(&metric))
	assert.Equal(t, 2.0, *metric.Counter.Value)
}

func TestNotAllowed(t *testing.T) {
	endpoint := NewEndpoint(NewMetricsViewService(), &testRBAC{false}, &mockDashboardService{&v1.Dashboard{}}).(*endpoint)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/view", strings.NewReader(`{"project":"project","dashboard":"dashboard", "render_errors":2, "render_time_secs":1.7}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user", &jwt.Token{
		Claims: &jwt.RegisteredClaims{},
	})

	err := endpoint.view(ctx)
	require.Error(t, err)
	require.ErrorIs(t, err, apiInterface.UnauthorizedError)
}

func TestDashboardDoesntExist(t *testing.T) {
	endpoint := NewEndpoint(NewMetricsViewService(), &testRBAC{true}, &mockDashboardService{nil}).(*endpoint)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/view", strings.NewReader(`{"project":"project","dashboard":"dashboard", "render_errors":2, "render_time_secs":1.7}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user", &jwt.Token{
		Claims: &jwt.RegisteredClaims{},
	})

	err := endpoint.view(ctx)
	require.Error(t, err)
	require.ErrorIs(t, err, apiInterface.NotFoundError)
}
