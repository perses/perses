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

package schemas

import (
	"github.com/perses/perses/internal/api/utils"
	"github.com/prometheus/client_golang/prometheus"
)

const (
	successStatus = "success"
	errorStatus   = "error"
)

// Enums for label values related to schemas load monitoring:

type LoadType string

const (
	Change LoadType = "change" // tracks the case of dynamic changes detected by file watch
	Full   LoadType = "full"   // tracks the case of full schemas load (at start & cron task)
)

type SchemaType string

const (
	Migration SchemaType = "migration" // tracks the migration schemas only
	Model     SchemaType = "model"     // tracks the "real" plugin schema to be used for backend validation.
)

var labelNames = []string{"status", "schema", "load"}

// A gauge that keeps track of the amount of (failed & successful) attempts to load plugin schemas.
var loadAttempts = prometheus.NewGaugeVec(prometheus.GaugeOpts{
	Namespace: utils.MetricNamespace,
	Name:      "plugin_schemas_load_attempts",
	Help:      "Amount of attempts to load plugin schemas",
}, labelNames)

func RegisterMetrics(reg prometheus.Registerer) {
	reg.MustRegister(loadAttempts)
}

func MonitorLoadAttempts(successCount, errorCount int, schema SchemaType, load LoadType) {
	loadAttempts.WithLabelValues(successStatus, string(schema), string(load)).Set(float64(successCount))
	loadAttempts.WithLabelValues(errorStatus, string(schema), string(load)).Set(float64(errorCount))
}
