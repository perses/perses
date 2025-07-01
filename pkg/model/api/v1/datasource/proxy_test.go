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

package datasource

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestGetKind tests the GetKind function with various inputs.
func TestGetKind(t *testing.T) {
	type aStruct struct {
		A struct {
			B struct {
				Kind string
				Spec struct {
					URL string
				}
			}
		}
	}

	a := &aStruct{
		A: struct {
			B struct {
				Kind string
				Spec struct{ URL string }
			}
		}{B: struct {
			Kind string
			Spec struct{ URL string }
		}{
			Kind: "HTTPProxy",
			Spec: struct{ URL string }{
				URL: "https://localhost:9090",
			},
		}},
	}

	uglyStruct := map[string]interface{}{
		"directUrl": "",
		"proxy": map[string]interface{}{
			"kind": "SQLProxy",
			"spec": map[string]interface{}{
				"driver":   "postgres",
				"address":  "localhost:5432",
				"database": "test",
				"user":     "postgres",
			},
		},
	}

	testCases := []struct {
		name         string
		pluginSpec   interface{}
		expectedKind string
		expectError  bool
	}{
		{
			name:         "struct",
			pluginSpec:   a,
			expectedKind: "httpproxy",
		},
		{
			name:         "map",
			pluginSpec:   uglyStruct,
			expectedKind: "sqlproxy",
		},
		{
			name: "no kind found",
			pluginSpec: struct {
				Name string
			}{
				Name: "NoKind",
			},
			expectedKind: "",
		},
		{
			name: "unexported kind field is ignored",
			pluginSpec: struct {
				kind string
				Name string
			}{
				kind: "Unexported",
				Name: "some-name",
			},
			expectedKind: "", // Should be empty as it cannot access the field
		},
		{
			name:         "nil input",
			pluginSpec:   nil,
			expectedKind: "",
		},
		{
			name: "map with wrong kind type",
			pluginSpec: map[string]interface{}{
				"kind": 12345,
			},
			expectedKind: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			kind, err := GetProxyKind(tc.pluginSpec)

			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedKind, kind)
			}
		})
	}
}

// TestValidateAndExtract tests the ValidateAndExtract function.
func TestValidateAndExtract(t *testing.T) {
	type testSpec struct {
		URL string `json:"url"`
	}

	type pluginWithSpec struct {
		Kind string   `json:"kind"`
		Spec testSpec `json:"spec"`
	}

	type pluginWithSpecPtr struct {
		Kind string    `json:"kind"`
		Spec *testSpec `json:"spec"`
	}

	type pluginWithInterfaceSpec struct {
		Kind string      `json:"kind"`
		Spec interface{} `json:"spec"`
	}

	type nestedPlugin struct {
		Proxy pluginWithSpec `json:"proxy"`
	}

	validSpec := testSpec{URL: "https://test.com"}
	validSpecMap := map[string]interface{}{"url": "https://test.com"}

	testCases := []struct {
		name           string
		kind           string
		pluginSpec     interface{}
		config         interface{}
		expectedConfig interface{}
		expectError    bool
		expectedError  string
	}{
		{
			name:           "simple struct",
			kind:           "PrometheusDatasource",
			pluginSpec:     pluginWithSpec{Kind: "PrometheusDatasource", Spec: validSpec},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "simple map",
			kind:           "PrometheusDatasource",
			pluginSpec:     map[string]interface{}{"kind": "PrometheusDatasource", "spec": validSpecMap},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "nested struct",
			kind:           "PrometheusDatasource",
			pluginSpec:     nestedPlugin{Proxy: pluginWithSpec{Kind: "PrometheusDatasource", Spec: validSpec}},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "nested map",
			kind:           "PrometheusDatasource",
			pluginSpec:     map[string]interface{}{"proxy": map[string]interface{}{"kind": "PrometheusDatasource", "spec": validSpecMap}},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "case insensitive kind match",
			kind:           "prometheusdatasource",
			pluginSpec:     pluginWithSpec{Kind: "PrometheusDatasource", Spec: validSpec},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "case insensitive field names",
			kind:           "PrometheusDatasource",
			pluginSpec:     map[string]interface{}{"kInD": "PrometheusDatasource", "sPeC": validSpecMap},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "spec is a pointer",
			kind:           "PrometheusDatasource",
			pluginSpec:     pluginWithSpecPtr{Kind: "PrometheusDatasource", Spec: &validSpec},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "spec is an interface",
			kind:           "PrometheusDatasource",
			pluginSpec:     pluginWithInterfaceSpec{Kind: "PrometheusDatasource", Spec: validSpecMap},
			config:         &testSpec{},
			expectedConfig: &validSpec,
		},
		{
			name:           "config is nil (validation only)",
			kind:           "PrometheusDatasource",
			pluginSpec:     pluginWithSpec{Kind: "PrometheusDatasource", Spec: validSpec},
			config:         nil,
			expectedConfig: nil,
		},
		{
			name:           "kind not found",
			kind:           "OtherPlugin",
			pluginSpec:     pluginWithSpec{Kind: "TempoDatasource", Spec: validSpec},
			config:         &testSpec{},
			expectedConfig: &testSpec{}, // config should be unchanged
		},
		{
			name:           "spec not found",
			kind:           "TempoDatasource",
			pluginSpec:     map[string]interface{}{"kind": "TempoDatasource"},
			config:         &testSpec{},
			expectedConfig: &testSpec{}, // config should be unchanged
		},
		{
			name:           "spec is nil",
			kind:           "TempoDatasource",
			pluginSpec:     pluginWithSpecPtr{Kind: "TempoDatasource", Spec: nil},
			config:         &testSpec{},
			expectedConfig: &testSpec{}, // config should be unchanged
		},
		{
			name:          "config is not a pointer",
			kind:          "TempoDatasource",
			pluginSpec:    pluginWithSpec{Kind: "TempoDatasource", Spec: validSpec},
			config:        testSpec{},
			expectError:   true,
			expectedError: "config must be a pointer",
		},
		{
			name:          "unmarshal error",
			kind:          "TempoDatasource",
			pluginSpec:    map[string]interface{}{"kind": "TempoDatasource", "spec": "not-a-map"},
			config:        &testSpec{},
			expectError:   true,
			expectedError: "json: cannot unmarshal",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateAndExtract(tc.kind, tc.pluginSpec, tc.config)

			if tc.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tc.expectedError)
			} else {
				assert.NoError(t, err)
				if tc.config != nil {
					assert.Equal(t, tc.expectedConfig, tc.config)
				}
			}
		})
	}
}
