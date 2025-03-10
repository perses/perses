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

package kubesd

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildLabelSelector(t *testing.T) {
	testSuite := []struct {
		name     string
		labels   map[string]string
		expected string
	}{
		{
			name:     "empty labels",
			labels:   map[string]string{},
			expected: "",
		},
		{
			name:     "single label with no value",
			labels:   map[string]string{"app": ""},
			expected: "app",
		},
		{
			name:     "single label with value",
			labels:   map[string]string{"app": "perses"},
			expected: "app=perses",
		},
		{
			name:     "multiple labels",
			labels:   map[string]string{"app": "perses", "env": "dev"},
			expected: "app=perses,env=dev",
		},
		{
			name:     "multiple labels with empty value",
			labels:   map[string]string{"app": "perses", "env": ""},
			expected: "app=perses,env",
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			result := buildLabelSelector(test.labels)
			assert.Equal(t, test.expected, result)
		})
	}
}
