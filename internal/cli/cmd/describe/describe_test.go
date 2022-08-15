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

package describe

import (
	"testing"

	"github.com/perses/perses/internal/cli/resource"
	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/pkg/client/fake/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func TestDescribeCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: resource.FormatMessage(),
		},
		{
			Title:           "kind not managed",
			Args:            []string{"whatever"},
			IsErrorExpected: true,
			ExpectedMessage: "resource \"whatever\" not managed",
		},
		{
			Title:           "resource name is missing",
			Args:            []string{"project"},
			IsErrorExpected: true,
			ExpectedMessage: "please specify the name of the resource you want to describe",
		},
		{
			Title:           "too many args",
			Args:            []string{"project", "perses", "another arg"},
			IsErrorExpected: true,
			ExpectedMessage: "you cannot have more than two arguments for the command 'describe'",
		},
		{
			Title:           "not connected to any API",
			Args:            []string{"project", "perses", "-ojson"},
			IsErrorExpected: true,
			ExpectedMessage: "you are not connected to any API",
		},
		{
			Title:           "describe project in json format",
			Args:            []string{"project", "perses", "-ojson"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: string(cmdTest.JSONMarshalStrict(
				&modelV1.Project{
					Kind: modelV1.KindProject,
					Metadata: modelV1.Metadata{
						Name: "perses",
					},
				})) + "\n",
		},
		{
			Title:           "describe project in yaml format",
			Args:            []string{"project", "perses", "-oyaml"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: string(cmdTest.YAMLMarshalStrict(
				&modelV1.Project{
					Kind: modelV1.KindProject,
					Metadata: modelV1.Metadata{
						Name: "perses",
					},
				})) + "\n",
		},
		{
			Title:           "describe folder in a specific project in json format",
			Args:            []string{"folder", "myFolder", "-ojson", "-p", "perses"},
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: string(cmdTest.JSONMarshalStrict(&modelV1.Folder{
				Kind: modelV1.KindFolder,
				Metadata: modelV1.ProjectMetadata{
					Metadata: modelV1.Metadata{
						Name: "myFolder",
					},
					Project: "perses",
				},
			})) + "\n",
		},
		{
			Title:           "describe folder with default project in json format",
			Args:            []string{"folder", "myFolder", "-ojson"},
			Project:         "perses",
			APIClient:       fakeapi.New(),
			IsErrorExpected: false,
			ExpectedMessage: string(cmdTest.JSONMarshalStrict(&modelV1.Folder{
				Kind: modelV1.KindFolder,
				Metadata: modelV1.ProjectMetadata{
					Metadata: modelV1.Metadata{
						Name: "myFolder",
					},
					Project: "perses",
				},
			})) + "\n",
		},
	}

	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
