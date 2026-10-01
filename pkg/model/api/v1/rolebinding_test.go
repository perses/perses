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

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalRoleBindingRemovesDuplicatedSubjects(t *testing.T) {
	testSuite := []struct {
		title            string
		jason            string
		yamele           string
		expectedSubjects []Subject
	}{
		{
			title:            "single subject",
			jason:            `{"role": "viewer", "subjects": [{"kind": "User", "name": "alice"}]}`,
			yamele:           "role: viewer\nsubjects:\n  - kind: User\n    name: alice\n",
			expectedSubjects: []Subject{{Kind: KindUser, Name: "alice"}},
		},
		{
			title:            "no duplicates",
			jason:            `{"role": "viewer", "subjects": [{"kind": "User", "name": "bob"}, {"kind": "User", "name": "alice"}]}`,
			yamele:           "role: viewer\nsubjects:\n  - kind: User\n    name: bob\n  - kind: User\n    name: alice\n",
			expectedSubjects: []Subject{{Kind: KindUser, Name: "bob"}, {Kind: KindUser, Name: "alice"}},
		},
		{
			title: "duplicates removed, first occurrences kept in order",
			jason: `{"role": "viewer", "subjects": [
				{"kind": "User", "name": "bob"}, {"kind": "User", "name": "alice"},
				{"kind": "User", "name": "bob"}, {"kind": "User", "name": "carol"}, {"kind": "User", "name": "alice"}]}`,
			yamele: "role: viewer\nsubjects:\n" +
				"  - kind: User\n    name: bob\n  - kind: User\n    name: alice\n" +
				"  - kind: User\n    name: bob\n  - kind: User\n    name: carol\n  - kind: User\n    name: alice\n",
			expectedSubjects: []Subject{{Kind: KindUser, Name: "bob"}, {Kind: KindUser, Name: "alice"}, {Kind: KindUser, Name: "carol"}},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			jsonSpec := RoleBindingSpec{}
			require.NoError(t, json.Unmarshal([]byte(test.jason), &jsonSpec))
			assert.Equal(t, test.expectedSubjects, jsonSpec.Subjects, "JSON")

			yamlSpec := RoleBindingSpec{}
			require.NoError(t, yaml.Unmarshal([]byte(test.yamele), &yamlSpec))
			assert.Equal(t, test.expectedSubjects, yamlSpec.Subjects, "YAML")
		})
	}
}

// The spec of a role binding is unmarshalled through its own UnmarshalJSON, so the duplicates are removed too.
func TestUnmarshalRoleBindingsRemovesDuplicatedSubjects(t *testing.T) {
	expectedSubjects := []Subject{{Kind: KindUser, Name: "alice"}, {Kind: KindUser, Name: "bob"}}

	roleBinding := RoleBinding{}
	require.NoError(t, json.Unmarshal([]byte(`{
		"kind": "RoleBinding",
		"metadata": {"name": "viewers", "project": "perses"},
		"spec": {"role": "viewer", "subjects": [{"kind": "User", "name": "alice"}, {"kind": "User", "name": "bob"}, {"kind": "User", "name": "alice"}]}
	}`), &roleBinding))
	assert.Equal(t, expectedSubjects, roleBinding.Spec.Subjects)

	globalRoleBinding := GlobalRoleBinding{}
	require.NoError(t, yaml.Unmarshal([]byte(`
kind: GlobalRoleBinding
metadata:
  name: admins
spec:
  role: admin
  subjects:
    - kind: User
      name: alice
    - kind: User
      name: alice
    - kind: User
      name: bob
`), &globalRoleBinding))
	assert.Equal(t, expectedSubjects, globalRoleBinding.Spec.Subjects)
}
