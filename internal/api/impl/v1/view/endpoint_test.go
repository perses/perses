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
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	io_prometheus_client "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/require"
)

func TestEndpoint(t *testing.T) {
	endpoint := NewEndpoint(NewMetricsViewService()).(*endpoint)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/view", strings.NewReader(`{"project":"project","dashboard":"dashboard", "render_errors":2, "render_time_secs":1.7}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	err := endpoint.View(ctx)
	require.NoError(t, err)

	metric := io_prometheus_client.Metric{}
	count, err := dashboardViewCounter.GetMetricWithLabelValues("project", "dashboard")
	require.NoError(t, err)
	require.NoError(t, count.Write(&metric))
	require.Equal(t, 1.0, *metric.Counter.Value)

	count, err = dashboardRenderErrorCounter.GetMetricWithLabelValues("project", "dashboard")
	require.NoError(t, err)
	require.NoError(t, count.Write(&metric))
	require.Equal(t, 2.0, *metric.Counter.Value)
}
