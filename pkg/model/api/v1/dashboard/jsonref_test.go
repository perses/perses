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

package dashboard

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestUnmarshalJSONRef(t *testing.T) {
	testSuite := []struct {
		title  string
		jason  string
		result *JSONRef
	}{
		{
			title: "simple ref",
			jason: `
{
  "$ref": "#/panels/load"
}
`,
			result: &JSONRef{
				Ref: "#/panels/load",
				Path: []string{
					"panels",
					"load",
				},
				Object: nil,
			},
		},
		{
			title: "ref with big path",
			jason: `
{
  "$ref": "#/my/incredible/super/long/path"
}
`,
			result: &JSONRef{
				Ref: "#/my/incredible/super/long/path",
				Path: []string{
					"my",
					"incredible",
					"super",
					"long",
					"path",
				},
				Object: nil,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &JSONRef{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalYAMLJSONRef(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result *JSONRef
	}{
		{
			title: "simple ref",
			yamele: `
$ref: "#/panels/load"
`,
			result: &JSONRef{
				Ref: "#/panels/load",
				Path: []string{
					"panels",
					"load",
				},
				Object: nil,
			},
		},
		{
			title: "ref with big path",
			yamele: `
$ref: "#/my/incredible/super/long/path"
`,
			result: &JSONRef{
				Ref: "#/my/incredible/super/long/path",
				Path: []string{
					"my",
					"incredible",
					"super",
					"long",
					"path",
				},
				Object: nil,
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &JSONRef{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), result))
			assert.Equal(t, test.result, result)
		})
	}
}

func TestUnmarshalJSONRefError(t *testing.T) {
	testSuite := []struct {
		title string
		jsone string
		err   error
	}{
		{
			title: "empty reference",
			jsone: `
{
  "$ref": ""
}
`,
			err: fmt.Errorf("ref '' is not accepted"),
		},
		{
			title: "reference with space",
			jsone: `
{
  "$ref": "#/foo/ref with space"
}
`,
			err: fmt.Errorf("ref '#/foo/ref with space' is not accepted"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &JSONRef{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jsone), result))
		})
	}
}
