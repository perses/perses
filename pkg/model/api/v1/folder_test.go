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

package v1

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUnmarshalFolderError(t *testing.T) {
	testSuite := []struct {
		title string
		jason string
		err   error
	}{
		{
			title: "spec cannot be empty",
			jason: `
{
  "kind": "Folder",
  "metadata": {
    "name": "test",
    "project": "perses"
  }
}
`,
			err: fmt.Errorf("spec cannot be empty"),
		},
		{
			title: "multiple dashboard references",
			jason: `

{
  "kind": "Folder",
  "metadata": {
    "name": "test",
    "project": "perses"
  },
  "spec": [
    {
       "kind": "Dashboard",
       "name": "myDashboard"
    },
    {
      "kind": "Folder",
      "name": "Test",
      "spec": [
        {
          "kind": "Dashboard",
          "name": "myDashboard"
        }
      ]
    }
  ]
}
`,
			err: fmt.Errorf("dashboard \"myDashboard\" is referenced multiple times in the folder \"test\""),
		},
		{
			title: "dashboard cannot have a list of sub-folder",
			jason: `

{
  "kind": "Folder",
  "metadata": {
    "name": "test",
    "project": "perses"
  },
  "spec": [
    {
       "kind": "Dashboard",
       "name": "myDashboard",
       "spec": [{
         "kind": "Dashboard",
         "name": "myDashboard"
       }]
    }
  ]
}
`,
			err: fmt.Errorf("when kind is equal to \"Dashboard\", then spec must be empty"),
		},
		{
			title: "folder must have a list of specFolder",
			jason: `

{
  "kind": "Folder",
  "metadata": {
    "name": "test",
    "project": "perses"
  },
  "spec": [
    {
       "kind": "Folder",
       "name": "mySubFolder"
    }
  ]
}
`,
			err: fmt.Errorf("when kind is equal to \"Folder\", then spec cannot be empty"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Folder{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &result))
		})
	}
}
