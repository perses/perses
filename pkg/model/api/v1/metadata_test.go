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

package v1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestKind_validateError(t *testing.T) {
	testSuites := []struct {
		title       string
		kind        Kind
		resultError error
	}{
		{
			title:       "empty kind",
			kind:        "",
			resultError: fmt.Errorf("kind cannot be empty"),
		},
		{
			title:       "unknown kind",
			kind:        "unknown",
			resultError: fmt.Errorf("unknown kind \"unknown\" used"),
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.resultError, (&test.kind).validate())
		})
	}
}

func TestKind_validate(t *testing.T) {
	testSuites := []struct {
		title string
		kind  Kind
	}{
		{
			title: "project",
			kind:  KindProject,
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			assert.NoError(t, (&test.kind).validate())
		})
	}
}
