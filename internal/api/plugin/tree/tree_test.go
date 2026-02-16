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

package tree

import (
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/stretchr/testify/assert"
)

type treeParameter struct {
	name     string
	metadata plugin.ModuleMetadata
	instance any
}

func TestTree_Add(t *testing.T) {
	testSuite := []struct {
		name          string
		baseTree      Tree[any]
		treeParameter []treeParameter
		expectedTree  Tree[any]
	}{
		{
			name:     "single version becomes latest",
			baseTree: nil,
			treeParameter: []treeParameter{
				{
					name:     "schema",
					metadata: plugin.ModuleMetadata{Version: "v1.0.0", Registry: ""},
					instance: "inst-1",
				},
			},
			expectedTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "inst-1",
					"latest": "inst-1",
				},
			},
		},
		{
			name: "adding higher version updates latest",
			baseTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "old-inst",
					"latest": "old-inst",
				},
			},
			treeParameter: []treeParameter{
				{
					name:     "schema",
					metadata: plugin.ModuleMetadata{Version: "v1.1.0", Registry: ""},
					instance: "new-inst",
				},
			},
			expectedTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "old-inst",
					"v1.1.0": "new-inst",
					"latest": "new-inst",
				},
			},
		},
		{
			name:     "different registries are distinct keys",
			baseTree: nil,
			treeParameter: []treeParameter{
				{"schema", plugin.ModuleMetadata{Version: "v0.1.0", Registry: "regA"}, "a-inst"},
				{"schema", plugin.ModuleMetadata{Version: "v0.1.0", Registry: "regB"}, "b-inst"},
			},
			expectedTree: Tree[any]{
				node{name: "schema", registry: "regA"}: {
					"v0.1.0": "a-inst",
					"latest": "a-inst",
				},
				node{name: "schema", registry: "regB"}: {
					"v0.1.0": "b-inst",
					"latest": "b-inst",
				},
			},
		},
		{
			name:     "duplicate version overwrites instance",
			baseTree: nil,
			treeParameter: []treeParameter{
				{"dup", plugin.ModuleMetadata{Version: "v2.0.0", Registry: ""}, "first"},
				{"dup", plugin.ModuleMetadata{Version: "v2.0.0", Registry: ""}, "second"},
			},
			expectedTree: Tree[any]{
				node{name: "dup", registry: plugin.DefaultRegistry}: {
					"v2.0.0": "second",
					"latest": "second",
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			if test.baseTree == nil {
				test.baseTree = make(Tree[any])
			}
			for _, thing := range test.treeParameter {
				test.baseTree.Add(thing.name, thing.metadata, thing.instance)
			}
		})
		assert.Equal(t, test.expectedTree, test.baseTree)
	}
}

func TestTree_Remove(t *testing.T) {
	testSuite := []struct {
		name         string
		baseTree     Tree[any]
		removes      []treeParameter
		expectedTree Tree[any]
	}{
		{
			name: "remove non-existent version is no-op",
			baseTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "inst-1",
					"latest": "inst-1",
				},
			},
			removes: []treeParameter{{name: "schema", metadata: plugin.ModuleMetadata{Version: "v2.0.0", Registry: ""}}},
			expectedTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "inst-1",
					"latest": "inst-1",
				},
			},
		},
		{
			name: "remove non-latest version",
			baseTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "old-inst",
					"v1.1.0": "new-inst",
					"latest": "new-inst",
				},
			},
			removes: []treeParameter{{name: "schema", metadata: plugin.ModuleMetadata{Version: "v1.0.0", Registry: ""}}},
			expectedTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.1.0": "new-inst",
					"latest": "new-inst",
				},
			},
		},
		{
			name: "remove latest updates latest to highest remaining",
			baseTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "a-inst",
					"v1.2.0": "c-inst",
					"latest": "c-inst",
				},
			},
			removes: []treeParameter{{name: "schema", metadata: plugin.ModuleMetadata{Version: "v1.2.0", Registry: ""}}},
			expectedTree: Tree[any]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "a-inst",
					"latest": "a-inst",
				},
			},
		},
		{
			name: "remove last version deletes key",
			baseTree: Tree[any]{
				node{name: "dup", registry: plugin.DefaultRegistry}: {
					"v2.0.0": "second",
					"latest": "second",
				},
			},
			removes:      []treeParameter{{name: "dup", metadata: plugin.ModuleMetadata{Version: "v2.0.0", Registry: ""}}},
			expectedTree: Tree[any]{},
		},
		{
			name: "remove version in one registry does not affect other",
			baseTree: Tree[any]{
				node{name: "schema", registry: "regA"}: {
					"v0.1.0": "a-inst",
					"latest": "a-inst",
				},
				node{name: "schema", registry: "regB"}: {
					"v0.1.0": "b-inst",
					"latest": "b-inst",
				},
			},
			removes: []treeParameter{{name: "schema", metadata: plugin.ModuleMetadata{Version: "v0.1.0", Registry: "regA"}}},
			expectedTree: Tree[any]{
				node{name: "schema", registry: "regB"}: {
					"v0.1.0": "b-inst",
					"latest": "b-inst",
				},
			},
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			based := test.baseTree
			if based == nil {
				based = make(Tree[any])
			}
			for _, r := range test.removes {
				based.Remove(r.name, r.metadata)
			}
			assert.Equal(t, test.expectedTree, based)
		})
	}
}

func TestTree_Get(t *testing.T) {
	testSuite := []struct {
		name     string
		baseTree Tree[string]
		nameArg  string
		meta     plugin.ModuleMetadata
		expected string
		exists   bool
	}{
		{
			name: "get latest when version empty",
			baseTree: Tree[string]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "inst-1",
					"v1.1.0": "inst-2",
					"latest": "inst-2",
				},
			},
			nameArg:  "schema",
			meta:     plugin.ModuleMetadata{Version: "", Registry: ""},
			expected: "inst-2",
			exists:   true,
		},
		{
			name: "get specific existing version",
			baseTree: Tree[string]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "old-inst",
					"v1.1.0": "new-inst",
					"latest": "new-inst",
				},
			},
			nameArg:  "schema",
			meta:     plugin.ModuleMetadata{Version: "v1.0.0", Registry: ""},
			expected: "old-inst",
			exists:   true,
		},
		{
			name: "get non-existent version returns false",
			baseTree: Tree[string]{
				node{name: "schema", registry: plugin.DefaultRegistry}: {
					"v1.0.0": "inst-1",
					"latest": "inst-1",
				},
			},
			nameArg: "schema",
			meta:    plugin.ModuleMetadata{Version: "v9.9.9", Registry: ""},
			exists:  false,
		},
		{
			name: "registry isolation",
			baseTree: Tree[string]{
				node{name: "schema", registry: "regA"}: {
					"v0.1.0": "a-inst",
					"latest": "a-inst",
				},
				node{name: "schema", registry: "regB"}: {
					"v0.1.0": "b-inst",
					"latest": "b-inst",
				},
			},
			nameArg:  "schema",
			meta:     plugin.ModuleMetadata{Version: "v0.1.0", Registry: "regB"},
			expected: "b-inst",
			exists:   true,
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			// prepare the tree
			tree := test.baseTree
			val, ok := tree.Get(test.nameArg, test.meta)
			if test.exists {
				assert.True(t, ok)
				assert.Equal(t, test.expected, val)
			} else {
				assert.False(t, ok)
			}
		})
	}
}
