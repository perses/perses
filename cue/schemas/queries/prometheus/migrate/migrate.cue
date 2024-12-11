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

package migrate

#target: _

// NB we would need `if` to support short-circuit in order to avoid code duplication here.
//    See https://github.com/cue-lang/cue/issues/2232
if (*#target.datasource.type | null) == "prometheus" && #target.expr != _|_ {
	kind: "PrometheusTimeSeriesQuery"
	spec: {
		datasource: {
			kind: "PrometheusDatasource"
			name: #target.datasource.uid
		}
		query:         #target.expr
		#legendFormat: *#target.legendFormat | "__auto"
		if #legendFormat != "__auto" {
			seriesNameFormat: #legendFormat
		}
		if #target.interval != _|_ {
			minStep: #target.interval
		}
	}
},

// The datasource.type may not be present while we are dealing with a prometheus query.
// In such case, rely on the "expr" field, whose presence likely indicates that this is a prometheus query.
// /!\ This is a best-effort conversion logic and may wrongly convert not-prometheus queries to PrometheusTimeSeriesQuery
if #target.expr != _|_ {
	kind: "PrometheusTimeSeriesQuery"
	spec: {
		if #target.datasource != _|_ {
			datasource: {
				kind: "PrometheusDatasource"
				name: #target.datasource.uid
			}
		}
		query:         #target.expr
		#legendFormat: *#target.legendFormat | "__auto"
		if #legendFormat != "__auto" {
			seriesNameFormat: #legendFormat
		}
		if #target.interval != _|_ {
			minStep: #target.interval
		}
	}
},
