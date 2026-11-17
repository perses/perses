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

package grafana

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReplaceInputValue(t *testing.T) {
	tests := []struct {
		title     string
		input     map[string]string
		dashboard string
		expected  string
	}{
		{
			title:     "no input",
			dashboard: `{"datasource": {"uid": "${DS_PROMETHEUS}"}}`,
			expected:  `{"datasource": {"uid": "${DS_PROMETHEUS}"}}`,
		},
		{
			title:     "both syntaxes of the placeholders",
			input:     map[string]string{"DS_PROMETHEUS": "prometheus"},
			dashboard: `{"datasource": {"uid": "${DS_PROMETHEUS}"}, "targets": [{"datasource": "$DS_PROMETHEUS"}]}`,
			expected:  `{"datasource": {"uid": "prometheus"}, "targets": [{"datasource": "prometheus"}]}`,
		},
		{
			title:     "several inputs",
			input:     map[string]string{"DS_PROMETHEUS": "prometheus", "VAR_JOB": "node"},
			dashboard: `{"datasource": "${DS_PROMETHEUS}", "expr": "up{job=\"$VAR_JOB\"}"}`,
			expected:  `{"datasource": "prometheus", "expr": "up{job=\"node\"}"}`,
		},
		{
			title:     "value escaped to stay a valid JSON string",
			input:     map[string]string{"VAR_LABEL": `say "hi" \ bye`},
			dashboard: `{"label": "${VAR_LABEL}"}`,
			expected:  `{"label": "say \"hi\" \\ bye"}`,
		},
		{
			title:     "placeholder without input kept",
			input:     map[string]string{"DS_PROMETHEUS": "prometheus"},
			dashboard: `{"datasource": "${DS_LOKI}"}`,
			expected:  `{"datasource": "${DS_LOKI}"}`,
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expected, ReplaceInputValue(test.input, test.dashboard))
		})
	}
}
