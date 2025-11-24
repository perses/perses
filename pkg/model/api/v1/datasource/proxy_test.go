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
	"net/url"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/perses/perses/pkg/model/api/v1/datasource/sql"
	"github.com/stretchr/testify/assert"
)

// TestValidateAndExtract tests the ValidateAndExtract function.
func TestValidateAndExtract(t *testing.T) {
	type testSpec struct {
		URL string `json:"url"`
	}

	type testSQLSpec struct {
		Driver   string              `json:"driver"`
		Host     string              `json:"host"`
		Database string              `json:"database"`
		Postgres *sql.PostgresConfig `json:"postgres,omitempty"`
	}

	type pluginWithSpec struct {
		Kind string   `json:"kind"`
		Spec testSpec `json:"spec"`
	}

	type nestedPlugin struct {
		Proxy pluginWithSpec `json:"proxy"`
	}

	validSpec := testSpec{URL: "https://test.com"}
	validSQLSpec := testSQLSpec{Driver: "postgres", Host: "test.com", Database: "test", Postgres: &sql.PostgresConfig{SSLMode: "disable"}}
	validSpecMap := map[string]any{"url": "https://test.com"}

	testURL, err := url.Parse("https://test.com")
	assert.NoError(t, err)

	validHTTPConfig := &http.Config{
		URL: &common.URL{
			URL: testURL,
		},
	}

	testCases := []struct {
		name           string
		expectedKind   string
		pluginSpec     any
		config         any
		expectedConfig any
		expectError    bool
		expectedError  string
	}{
		{
			name:           "get kind only",
			pluginSpec:     pluginWithSpec{Kind: "HTTPProxy", Spec: validSpec},
			expectedKind:   "httpproxy",
			expectedConfig: nil,
		},
		{
			name:           "simple struct",
			pluginSpec:     pluginWithSpec{Kind: "HTTPProxy", Spec: validSpec},
			expectedConfig: validHTTPConfig,
		},
		{
			name:         "simple map",
			pluginSpec:   map[string]any{"kind": "SQLProxy", "spec": validSQLSpec},
			expectedKind: "sqlproxy",
			expectedConfig: &sql.Config{
				Driver:   "postgres",
				Host:     "test.com",
				Database: "test",
				Postgres: &sql.PostgresConfig{
					SSLMode: "disable",
				},
			},
		},
		{
			name:           "nested struct",
			pluginSpec:     nestedPlugin{Proxy: pluginWithSpec{Kind: "HTTPProxy", Spec: validSpec}},
			expectedKind:   "httpproxy",
			expectedConfig: validHTTPConfig,
		},
		{
			name:           "nested map",
			pluginSpec:     map[string]any{"proxy": map[string]any{"kind": "HTTPProxy", "spec": validSpecMap}},
			expectedKind:   "httpproxy",
			expectedConfig: validHTTPConfig,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cfg, kind, err := ValidateAndExtract(tc.pluginSpec)

			if tc.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tc.expectedError)
			} else {
				assert.NoError(t, err)
				if tc.expectedKind != "" {
					assert.Equal(t, tc.expectedKind, kind)
				}
				if tc.expectedConfig != nil {
					assert.Equal(t, tc.expectedConfig, cfg)
				}
			}
		})
	}
}
