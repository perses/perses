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

package auth

import (
	"testing"

	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
)

func TestExtractPersistedClaims(t *testing.T) {
	testSuites := []struct {
		title       string
		rawClaims   map[string]any
		configs     []config.ProviderClaimConfig
		expected    map[string][]string
	}{
		{
			title:     "nil claimConfigs returns nil",
			rawClaims: map[string]any{"roles": []any{"admin"}},
			configs:   nil,
			expected:  nil,
		},
		{
			title:     "empty rawClaims returns nil",
			rawClaims: map[string]any{},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  nil,
		},
		{
			title:     "single string value",
			rawClaims: map[string]any{"roles": "admin"},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  map[string][]string{"roles": {"admin"}},
		},
		{
			title:     "empty string value ignored returns nil",
			rawClaims: map[string]any{"roles": ""},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  nil,
		},
		{
			title:     "array of strings",
			rawClaims: map[string]any{"roles": []any{"admin", "viewer"}},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  map[string][]string{"roles": {"admin", "viewer"}},
		},
		{
			title:     "array with non-string items are skipped",
			rawClaims: map[string]any{"roles": []any{42, "admin"}},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  map[string][]string{"roles": {"admin"}},
		},
		{
			title:     "unconfigured claim keys are ignored",
			rawClaims: map[string]any{"roles": []any{"admin"}, "other": "x"},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  map[string][]string{"roles": {"admin"}},
		},
		{
			title:     "missing configured claim key returns nil",
			rawClaims: map[string]any{"groups": []any{"eng"}},
			configs:   []config.ProviderClaimConfig{{ClaimName: "roles"}},
			expected:  nil,
		},
		{
			title:     "multiple configured claims both present",
			rawClaims: map[string]any{"roles": []any{"admin"}, "groups": []any{"eng"}},
			configs: []config.ProviderClaimConfig{
				{ClaimName: "roles"},
				{ClaimName: "groups"},
			},
			expected: map[string][]string{"roles": {"admin"}, "groups": {"eng"}},
		},
		{
			title:     "only one of two configured claims present",
			rawClaims: map[string]any{"roles": []any{"admin"}},
			configs: []config.ProviderClaimConfig{
				{ClaimName: "roles"},
				{ClaimName: "groups"},
			},
			expected: map[string][]string{"roles": {"admin"}},
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			got := extractPersistedClaims(test.rawClaims, test.configs)
			assert.Equal(t, test.expected, got)
		})
	}
}
