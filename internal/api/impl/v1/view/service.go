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
	"github.com/perses/perses/internal/api/interface/v1/view"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/prometheus/client_golang/prometheus"
)

var labelNames = []string{"project", "dashboard"}

// A counter for the total number of views of a dashboard.
var dashboardViewCounter = prometheus.NewCounterVec(prometheus.CounterOpts{
	Namespace: utils.MetricNamespace,
	Name:      "dashboard_views_total",
	Help:      "The total number of views of a dashboard",
}, labelNames)

// A counter for the total number of render errors of a dashboard.
var dashboardRenderErrorCounter = prometheus.NewCounterVec(prometheus.CounterOpts{
	Namespace: utils.MetricNamespace,
	Name:      "dashboard_render_errors_total",
	Help:      "The total number of render errors of a dashboard",
}, labelNames)

// A histogram for the render time of a dashboard.
var dashboardRenderTime = prometheus.NewHistogramVec(prometheus.HistogramOpts{
	Namespace: utils.MetricNamespace,
	Name:      "dashboard_render_time_seconds",
	Help:      "The render time of a dashboard",
	Buckets:   prometheus.DefBuckets,
}, labelNames)

func RegisterMetrics(reg prometheus.Registerer) {
	reg.MustRegister(dashboardViewCounter)
	reg.MustRegister(dashboardRenderErrorCounter)
	reg.MustRegister(dashboardRenderTime)
}

// A service that keeps track of views in Prometheus metrics that can be
// scraped and stored by Prometheus.
type metricsViewService struct {
}

func NewMetricsViewService() view.Service {
	return &metricsViewService{}
}

func (m *metricsViewService) View(view *v1.View) error {
	dashboardViewCounter.WithLabelValues(view.Project, view.Dashboard).Inc()

	dashboardRenderErrorCounter.WithLabelValues(view.Project, view.Dashboard).Add(float64(view.RenderErrors))

	if view.RenderTimeSecs > 0 {
		dashboardRenderTime.WithLabelValues(view.Project, view.Dashboard).Observe(view.RenderTimeSecs)
	}

	return nil
}
