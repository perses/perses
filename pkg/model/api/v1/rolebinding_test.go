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
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalRoleBindingSpecRemovesDuplicatedSubjects(t *testing.T) {
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

// Above maxSubjectsForLinearDeduplication subjects, the duplicates are found with a map instead of a linear scan.
func TestUnmarshalRoleBindingSpecRemovesDuplicatedSubjectsFromLargeList(t *testing.T) {
	uniqueCount := maxSubjectsForLinearDeduplication + 4
	expectedSubjects := make([]Subject, 0, uniqueCount)
	jsonSubjects := make([]string, 0, 2*uniqueCount)
	for i := 0; i < uniqueCount; i++ {
		expectedSubjects = append(expectedSubjects, Subject{Kind: KindUser, Name: fmt.Sprintf("user%d", i)})
		jsonSubjects = append(jsonSubjects, fmt.Sprintf(`{"kind": "User", "name": "user%d"}`, i))
	}
	// Every user is listed a second time, in the reverse order.
	for i := uniqueCount - 1; i >= 0; i-- {
		jsonSubjects = append(jsonSubjects, fmt.Sprintf(`{"kind": "User", "name": "user%d"}`, i))
	}
	require.Greater(t, len(jsonSubjects), maxSubjectsForLinearDeduplication)

	spec := RoleBindingSpec{}
	require.NoError(t, json.Unmarshal([]byte(`{"role": "viewer", "subjects": [`+strings.Join(jsonSubjects, ",")+`]}`), &spec))
	assert.Equal(t, expectedSubjects, spec.Subjects)
}

// The spec of a role binding is unmarshalled through its own UnmarshalJSON, so the duplicates are removed too.
func TestUnmarshalRoleBindingAndGlobalRoleBindingRemoveDuplicatedSubjects(t *testing.T) {
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
