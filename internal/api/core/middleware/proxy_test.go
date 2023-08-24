// Copyright 2023 The Perses Authors
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

package middleware

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExtractGlobalDatasourceAndPath(t *testing.T) {
	testSuite := []struct {
		title           string
		path            string
		expectedDTSName string
		expectedPath    string
	}{
		{
			title:           "no dts path",
			path:            "/proxy/globaldatasources/turlututu",
			expectedDTSName: "turlututu",
			expectedPath:    "/",
		},
		{
			title:           "with path",
			path:            "/proxy/globaldatasources/four/api/v1/query_range?foo=bar",
			expectedDTSName: "four",
			expectedPath:    "/api/v1/query_range?foo=bar",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			dtsName, path, err := extractGlobalDatasourceAndPath(test.path)
			assert.NoError(t, err)
			assert.Equal(t, test.expectedDTSName, dtsName)
			assert.Equal(t, test.expectedPath, path)
		})
	}
}

func TestExtractProjectDatasourceAndPath(t *testing.T) {
	testSuite := []struct {
		title               string
		path                string
		expectedProjectName string
		expectedDTSName     string
		expectedPath        string
	}{
		{
			title:               "no dts path",
			path:                "/proxy/projects/perses/datasources/turlututu",
			expectedProjectName: "perses",
			expectedDTSName:     "turlututu",
			expectedPath:        "/",
		},
		{
			title:               "with path",
			path:                "/proxy/projects/four/datasources/four/api/v1/query_range?foo=bar",
			expectedProjectName: "four",
			expectedDTSName:     "four",
			expectedPath:        "/api/v1/query_range?foo=bar",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			projectName, dtsName, path, err := extractProjectDatasourceAndPath(test.path)
			assert.NoError(t, err)
			assert.Equal(t, test.expectedProjectName, projectName)
			assert.Equal(t, test.expectedDTSName, dtsName)
			assert.Equal(t, test.expectedPath, path)
		})
	}
}
