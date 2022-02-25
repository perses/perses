// Copyright 2022 The Perses Authors
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

package get

import (
	"bytes"
	"encoding/json"
	"testing"

	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/fake_api"
	"github.com/perses/perses/pkg/client/fake_api/fake_v1"
	"github.com/stretchr/testify/assert"
)

func JSONMarshalStrict(obj interface{}) []byte {
	if data, err := json.Marshal(obj); err != nil {
		panic(err)
	} else {
		return data
	}
}

func TestGetCMD(t *testing.T) {
	testSuite := []struct {
		title           string
		args            []string
		apiClient       api.ClientInterface
		project         string
		expectedMessage string
		isErrorExpected bool
	}{
		{
			title:           "empty args",
			args:            []string{},
			isErrorExpected: true,
			expectedMessage: cmdUtils.FormatAvailableResourcesMessage(),
		},
		{
			title:           "kind not managed",
			args:            []string{"whatever"},
			isErrorExpected: true,
			expectedMessage: "resource \"whatever\" not managed",
		},
		{
			title:           "not connected to anyAPI",
			args:            []string{"project", "-ojson"},
			isErrorExpected: true,
			expectedMessage: "you are not connected to any API",
		},
		{
			title:           "get project in json format",
			args:            []string{"project", "-ojson"},
			apiClient:       fake_api.New(),
			isErrorExpected: false,
			expectedMessage: string(JSONMarshalStrict(fake_v1.ProjectList(""))) + "\n",
		},
		{
			title:           "get project with prefix in json format",
			args:            []string{"project", "per", "-ojson"},
			apiClient:       fake_api.New(),
			isErrorExpected: false,
			expectedMessage: string(JSONMarshalStrict(fake_v1.ProjectList("per"))) + "\n",
		},
		{
			title:           "get globaldatasource in json format",
			args:            []string{"gdts", "-ojson"},
			apiClient:       fake_api.New(),
			isErrorExpected: false,
			expectedMessage: string(JSONMarshalStrict(fake_v1.GlobalDatasourceList(""))) + "\n",
		},
		{
			title:           "get all folder in json format",
			args:            []string{"folder", "-ojson", "--all"},
			apiClient:       fake_api.New(),
			isErrorExpected: false,
			expectedMessage: string(JSONMarshalStrict(fake_v1.FolderList("", ""))) + "\n",
		},
		{
			title:           "get folder in a specific project in json format",
			args:            []string{"folder", "-ojson", "-p", "perses"},
			apiClient:       fake_api.New(),
			isErrorExpected: false,
			expectedMessage: string(JSONMarshalStrict(fake_v1.FolderList("perses", ""))) + "\n",
		},
		{
			title:           "get folder with default project in json format",
			args:            []string{"folder", "-ojson"},
			project:         "perses",
			apiClient:       fake_api.New(),
			isErrorExpected: false,
			expectedMessage: string(JSONMarshalStrict(fake_v1.FolderList("perses", ""))) + "\n",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			cmd := NewCMD()
			buffer := bytes.NewBufferString("")
			cmd.SetOut(buffer)
			cmd.SetErr(buffer)
			cmd.SetArgs(test.args)
			cmdUtils.GlobalConfig.SetAPIClient(test.apiClient)
			cmdUtils.GlobalConfig.Project = test.project

			err := cmd.Execute()
			if test.isErrorExpected {
				if assert.NotNil(t, err) {
					assert.Equal(t, test.expectedMessage, err.Error())
				}
			} else if assert.Nil(t, err) {
				assert.Equal(t, test.expectedMessage, buffer.String())
			}
		})
	}
}
