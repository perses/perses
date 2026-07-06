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

package schema

import (
	"testing"

	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
)

func makePromQLPlugin(query string) plugin.Plugin {
	return plugin.Plugin{
		Kind: prometheusTimeSeriesQueryKind,
		Spec: map[string]any{
			"query": query,
		},
	}
}

func TestValidateQuerySemantic_ValidPromQL(t *testing.T) {
	tests := []struct {
		name  string
		query string
	}{
		{"simple metric", "up"},
		{"rate function", "rate(http_requests_total[5m])"},
		{"aggregation", "sum(rate(http_requests_total[5m])) by (job)"},
		{"histogram quantile", "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateQuerySemantic(makePromQLPlugin(tt.query), "testPanel", "n°1")
			assert.NoError(t, err)
		})
	}
}

func TestValidateQuerySemantic_InvalidPromQL(t *testing.T) {
	tests := []struct {
		name  string
		query string
	}{
		{"unclosed bracket", "rate(up[)"},
		{"unclosed paren", "sum(rate(up[5m])"},
		{"invalid syntax", "rate(up[5m]){"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateQuerySemantic(makePromQLPlugin(tt.query), "testPanel", "n°1")
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "invalid PromQL")
		})
	}
}

func TestValidateQuerySemantic_VariableRefsSkipped(t *testing.T) {
	tests := []struct {
		name  string
		query string
	}{
		{"dollar variable", `rate(http_requests_total{namespace="$namespace"}[5m])`},
		{"braced variable", `rate(http_requests_total{namespace="${namespace}"}[5m])`},
		{"variable in metric name", `$metric_name`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateQuerySemantic(makePromQLPlugin(tt.query), "testPanel", "n°1")
			assert.NoError(t, err)
		})
	}
}

func TestValidateQuerySemantic_EmptyQuery(t *testing.T) {
	err := validateQuerySemantic(makePromQLPlugin(""), "testPanel", "n°1")
	assert.NoError(t, err)
}

func TestValidateQuerySemantic_NonPrometheusPlugin(t *testing.T) {
	p := plugin.Plugin{
		Kind: "SQLQuery",
		Spec: map[string]any{
			"query": "SELECT * FROM invalid promql",
		},
	}
	err := validateQuerySemantic(p, "testPanel", "n°1")
	assert.NoError(t, err)
}
