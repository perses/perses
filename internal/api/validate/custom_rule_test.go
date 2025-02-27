// Copyright 2025 The Perses Authors
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

package validate

import (
	"path/filepath"
	"testing"

	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestDashboardWithCustomRules(t *testing.T) {
	var dash modelV1.Dashboard
	testUtils.JSONUnmarshalFromFile(filepath.Join("testdata", "dashboard_with_regex_in_variable.json"), &dash)

	testSuite := []struct {
		name          string
		rules         string
		expectedError bool
		errMsg        string
	}{
		{
			name: "wrong metadata.name",
			rules: `
- name: "Dashboard Naming Convention"
  target: "$.metadata.name"
  assertion: "value.matches('^[a-z]+(-[a-z]+)*$')"
  message: "Dashboard name must be all lowercase letters with hyphens only."

- name: "At Least One Panel Exists"
  target: "$.spec.panels"
  assertion: "value.size() > 0"
  message: "Dashboard must contain at least one panel."
`,
			expectedError: true,
			errMsg:        "Dashboard name must be all lowercase letters with hyphens only.",
		},
		{
			name: "wrong path to panels",
			rules: `
- name: "At Least One Panel Exists"
  target: "$.panels"
  assertion: "value.size() > 0"
  message: "Dashboard must contain at least one panel."
`,
			expectedError: true,
			errMsg:        "error while evaluating the jsonpath expression for the rule \"At Least One Panel Exists\": unknown key panels",
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			var customRules []*config.CustomLintRule
			testUtils.YAMLUnmarshal([]byte(test.rules), &customRules)
			err := DashboardWithCustomRules(&dash, customRules)
			if test.expectedError {
				assert.Error(t, err)
				assert.Equal(t, err.Error(), test.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
