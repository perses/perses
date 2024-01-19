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
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func getDummyDate() time.Time {
	dummyDate, err := time.Parse("2006-01-02 15:04:05", "1970-01-01 00:00:00")
	if err != nil {
		panic(err)
	}

	return dummyDate
}

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
	for i := range testSuites {
		test := testSuites[i]
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
		{
			title: "dashboard",
			kind:  "dAsHbOaRd",
		},
	}
	for i := range testSuites {
		test := testSuites[i]
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
		ProjectMetadataWrapper: ProjectMetadataWrapper{
			Project: "Perses",
		},
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

func TestUnmarshalMetadata(t *testing.T) {
	dummyDate := getDummyDate()

	testSuite := []struct {
		title  string
		jason  string
		yamele string
		result Metadata
	}{
		{
			title: "simple Prometheus datasource",
			jason: `
{
  "name": "foo",
  "createdAt": "1970-01-01T00:00:00.000000000Z",
  "updatedAt": "1970-01-01T00:00:00.000000000Z",
  "version": 1
}
`,
			yamele: `
name: "foo"
createdAt: "1970-01-01T00:00:00.000000000Z"
updatedAt: "1970-01-01T00:00:00.000000000Z"
version: 1
`,
			result: Metadata{
				Name:      "foo",
				CreatedAt: dummyDate,
				UpdatedAt: dummyDate,
				Version:   1,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			resultFromJSON := Metadata{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &resultFromJSON))
			assert.Equal(t, test.result, resultFromJSON)
			resultFromYAML := Metadata{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &resultFromYAML))
			assert.Equal(t, test.result, resultFromYAML)
		})
	}
}

func TestUnmarshalMetadataError(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		yamele string
		err    error
	}{
		{
			title: "name cannot be empty",
			jason: `
{
  "version": 1
}
`,
			yamele: `
version: 1
`,
			err: fmt.Errorf("name cannot be empty"),
		},
		{
			title: "name cannot contain spaces",
			jason: `
{
  "name": "f o o",
  "version": 1
}
`,
			yamele: `
name: "f o o"
version: 1
`,
			err: fmt.Errorf("\"f o o\" is not a correct name. It should match the regexp: ^[a-zA-Z0-9_.-]+$"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			mFromJSON := Metadata{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &mFromJSON))
			mFromYAML := Metadata{}
			assert.Equal(t, test.err, yaml.Unmarshal([]byte(test.yamele), &mFromYAML))
		})
	}
}

func TestUnmarshalProjectMetadata(t *testing.T) {
	dummyDate := getDummyDate()

	testSuite := []struct {
		title  string
		jason  string
		yamele string
		result ProjectMetadata
	}{
		{
			title: "simple Prometheus datasource",
			jason: `
{
  "name": "foo",
  "createdAt": "1970-01-01T00:00:00.000000000Z",
  "updatedAt": "1970-01-01T00:00:00.000000000Z",
  "version": 1,
  "project": "bar"
}
`,
			yamele: `
name: "foo"
createdAt: "1970-01-01T00:00:00.000000000Z"
updatedAt: "1970-01-01T00:00:00.000000000Z"
version: 1
project: "bar"
`,
			result: ProjectMetadata{
				Metadata: Metadata{
					Name:      "foo",
					CreatedAt: dummyDate,
					UpdatedAt: dummyDate,
					Version:   1,
				},
				ProjectMetadataWrapper: ProjectMetadataWrapper{
					Project: "bar",
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			resultFromJSON := ProjectMetadata{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &resultFromJSON))
			assert.Equal(t, test.result, resultFromJSON)
			resultFromYAML := ProjectMetadata{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &resultFromYAML))
			assert.Equal(t, test.result, resultFromYAML)
		})
	}
}

func TestUnmarshalProjectMetadataError(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		yamele string
		err    error
	}{
		{
			title: "name cannot be empty",
			jason: `
{
  "project": "foo"
}
`,
			yamele: `
project: "foo"
`,
			err: fmt.Errorf("name cannot be empty"),
		},
		{
			title: "name cannot contain spaces",
			jason: `
{
  "name": "f o o",
  "project": "bar"
}
`,
			yamele: `
name: "f o o"
project: "bar"
`,
			err: fmt.Errorf("\"f o o\" is not a correct name. It should match the regexp: ^[a-zA-Z0-9_.-]+$"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			mFromJSON := ProjectMetadata{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &mFromJSON))
			mfromYAML := ProjectMetadata{}
			assert.Equal(t, test.err, yaml.Unmarshal([]byte(test.yamele), &mfromYAML))
		})
	}
}
