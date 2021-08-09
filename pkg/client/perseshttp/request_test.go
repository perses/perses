// Copyright 2021 The Perses Authors
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

package perseshttp

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRequest_Query(t *testing.T) {
	testSuites := []struct {
		title  string
		query  QueryInterface
		result *Request
	}{
		{
			title: "Empty query",
			query: nil,
			result: &Request{
				queryParam: nil,
			},
		},
	}
	for _, testSuite := range testSuites {
		msg := fmt.Sprintf("%q failed", testSuite.title)
		request := &Request{}
		request.Query(testSuite.query)
		assert.Equal(t, testSuite.result, request, msg)
	}
}

func TestRequest_BuildPath(t *testing.T) {
	testSuites := []struct {
		title          string
		request        *Request
		expectedResult string
		expectedError  bool
	}{
		{
			title: "Resource missing",
			request: &Request{
				apiPrefix:  defaultAPIPrefix,
				apiVersion: defaultAPIVersion,
			},
			expectedResult: "",
			expectedError:  true,
		},
		{
			title: "Basic path with resource",
			request: &Request{
				apiPrefix:  defaultAPIPrefix,
				apiVersion: defaultAPIVersion,
				resource:   "projects",
			},
			expectedResult: "/api/v1/projects",
			expectedError:  false,
		},
		{
			title: "Path using Projects path",
			request: &Request{
				apiPrefix:  defaultAPIPrefix,
				apiVersion: defaultAPIVersion,
				project:    "perses",
				resource:   "prometheusrules",
			},
			expectedResult: "/api/v1/projects/perses/prometheusrules",
			expectedError:  false,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			path, err := test.request.buildPath()
			if test.expectedError {
				assert.NotNil(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.expectedResult, path)
			}
		})

	}
}
