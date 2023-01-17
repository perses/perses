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
	"time"

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

func TestProjectMetadata_UpdateVersion(t *testing.T) {
	m := ProjectMetadata{
		Metadata: Metadata{
			Name:      "test",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   0,
		},
		Project: "Perses",
	}
	// The idea here is to verify if we update multiple times a ProjectMetadata based on a previous version of the struct,
	// we will have the correct version number.
	for i := 0; i < 10; i++ {
		old := m
		// We reset the version of the current ProjectMetadata to simulate the fact the version should come from the previous struct
		// and then being increased.
		m.Version = 0
		m.Update(old)
	}
	assert.Equal(t, m.Version, uint64(10))
}
