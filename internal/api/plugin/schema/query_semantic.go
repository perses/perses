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
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/perses/spec/go/plugin"
	"github.com/prometheus/prometheus/promql/parser"
)

const prometheusTimeSeriesQueryKind = "PrometheusTimeSeriesQuery"

var variableRefRegexp = regexp.MustCompile(`\$\{?\w+`)

// validateQuerySemantic performs plugin-specific semantic validation on query content
// after CUE structural validation has passed. Currently validates PromQL syntax for
// PrometheusTimeSeriesQuery plugins.
func validateQuerySemantic(p plugin.Plugin, panelName string, queryName string) error {
	switch p.Kind {
	case prometheusTimeSeriesQueryKind:
		return validatePromQLQuery(p, panelName, queryName)
	default:
		return nil
	}
}

func validatePromQLQuery(p plugin.Plugin, panelName string, queryName string) error {
	query, err := extractQueryString(p.Spec)
	if err != nil || query == "" {
		return nil
	}
	if variableRefRegexp.MatchString(query) {
		return nil
	}
	_, parseErr := parser.NewParser(parser.Options{}).ParseExpr(query)
	if parseErr != nil {
		return fmt.Errorf("panel %q query %s: invalid PromQL: %w", panelName, queryName, parseErr)
	}
	return nil
}

func extractQueryString(spec any) (string, error) {
	data, err := json.Marshal(spec)
	if err != nil {
		return "", err
	}
	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		return "", err
	}
	q, _ := m["query"].(string)
	return strings.TrimSpace(q), nil
}
