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

	"github.com/perses/perses/pkg/model/api"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/rbac"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	promclient "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var _ = rbac.RBAC(&testRBAC{})
var _ = dashboard.Service(&mockDashboardService{})

type testRBAC struct {
	allow bool
}

func (t *testRBAC) GetPermissions(_ apiInterface.PersesContext) map[string][]*role.Permission {
	return map[string][]*role.Permission{}
}

func (t *testRBAC) HasPermission(_ apiInterface.PersesContext, _ role.Action, _ string, _ role.Scope) bool {
	return t.allow
}

func (t *testRBAC) IsEnabled() bool {
	return true
}

func (t *testRBAC) Refresh() error {
	panic("unimplemented")
}

func (t *testRBAC) GetUserProjects(_ apiInterface.PersesContext, _ role.Action, _ role.Scope) []string {
	panic("unimplemented")
}

type mockDashboardService struct {
	dashboard *v1.Dashboard
}

func (*mockDashboardService) Validate(_ *v1.Dashboard) error {
	panic("unimplemented")
}

func (*mockDashboardService) Create(_ apiInterface.PersesContext, _ *v1.Dashboard) (*v1.Dashboard, error) {
	panic("unimplemented")
}
func (*mockDashboardService) Delete(_ apiInterface.PersesContext, _ apiInterface.Parameters) error {
	panic("unimplemented")
}

func (m *mockDashboardService) Get(_ apiInterface.PersesContext, _ apiInterface.Parameters) (*v1.Dashboard, error) {
	if m.dashboard != nil {
		return m.dashboard, nil
	}

	return nil, fmt.Errorf("not found")
}

func (*mockDashboardService) List(_ apiInterface.PersesContext, _ *dashboard.Query, _ apiInterface.Parameters) ([]*v1.Dashboard, error) {
	panic("unimplemented")
}

func (*mockDashboardService) RawList(_ apiInterface.PersesContext, _ *dashboard.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	panic("unimplemented")
}

func (*mockDashboardService) MetadataList(_ apiInterface.PersesContext, _ *dashboard.Query, _ apiInterface.Parameters) ([]api.Entity, error) {
	panic("unimplemented")
}

func (*mockDashboardService) RawMetadataList(_ apiInterface.PersesContext, _ *dashboard.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	panic("unimplemented")
}

func (*mockDashboardService) Update(_ apiInterface.PersesContext, _ *v1.Dashboard, _ apiInterface.Parameters) (*v1.Dashboard, error) {
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
		Claims: &crypto.JWTCustomClaims{},
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
		Claims: &crypto.JWTCustomClaims{},
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
		Claims: &crypto.JWTCustomClaims{},
	})

	err := endpoint.view(ctx)
	require.Error(t, err)
	require.ErrorIs(t, err, apiInterface.NotFoundError)
}
