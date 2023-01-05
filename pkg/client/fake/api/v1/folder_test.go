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

package fakev1

import (
	"testing"

	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestFolderList(t *testing.T) {
	testSuite := []struct {
		title          string
		project        string
		prefix         string
		expectedResult []*modelV1.Folder
	}{
		{
			title: "project and prefix empty",
			expectedResult: []*modelV1.Folder{
				{
					Kind: modelV1.KindFolder,
					Metadata: modelV1.ProjectMetadata{
						Metadata: modelV1.Metadata{
							Name: "FF15",
						},
						Project: "perses",
					},
				},
				{
					Kind: modelV1.KindFolder,
					Metadata: modelV1.ProjectMetadata{
						Metadata: modelV1.Metadata{
							Name: "AnotherFolder",
						},
						Project: "AnotherProject",
					},
				},
			},
		},
		{
			title:   "project set and prefix empty",
			project: "perses",
			expectedResult: []*modelV1.Folder{
				{
					Kind: modelV1.KindFolder,
					Metadata: modelV1.ProjectMetadata{
						Metadata: modelV1.Metadata{
							Name: "FF15",
						},
						Project: "perses",
					},
				},
			},
		},
		{
			title:  "project empty and prefix set",
			prefix: "Anot",
			expectedResult: []*modelV1.Folder{
				{
					Kind: modelV1.KindFolder,
					Metadata: modelV1.ProjectMetadata{
						Metadata: modelV1.Metadata{
							Name: "AnotherFolder",
						},
						Project: "AnotherProject",
					},
				},
			},
		},
		{
			title:   "project and prefix set",
			project: "AnotherProject",
			prefix:  "An",
			expectedResult: []*modelV1.Folder{
				{
					Kind: modelV1.KindFolder,
					Metadata: modelV1.ProjectMetadata{
						Metadata: modelV1.Metadata{
							Name: "AnotherFolder",
						},
						Project: "AnotherProject",
					},
				},
			},
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expectedResult, FolderList(test.project, test.prefix))
		})
	}
}
