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

package v1

import "testing"

func TestIsProjectDoesNotExistErrorMessage(t *testing.T) {
	testCases := []struct {
		title    string
		message  string
		expected bool
	}{
		{
			title:    "matching message",
			message:  `metadata.project "showcase-dac" doesn't exist`,
			expected: true,
		},
		{
			title:    "other message",
			message:  "bad request",
			expected: false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.title, func(t *testing.T) {
			actual := IsProjectDoesNotExistErrorMessage(testCase.message)
			if actual != testCase.expected {
				t.Fatalf("unexpected result. expected %t but got %t", testCase.expected, actual)
			}
		})
	}
}
