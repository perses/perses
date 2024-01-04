// Copyright 2024 The Perses Authors
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

package markdown

import (
	"testing"

	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
)

func TestPanelBuilder(t *testing.T) {
	testSuites := []struct {
		title          string
		sdkResult      modelV1.Panel
		expectedResult modelV1.Panel
	}{
		{
			title:     "basic markdown panel",
			sdkResult: NewPanel("test", "mysupertext").Build(),
			expectedResult: modelV1.Panel{
				Kind: "Panel",
				Spec: modelV1.PanelSpec{
					Display: modelV1.PanelDisplay{
						Name: "test",
					},
					Plugin: common.Plugin{
						Kind: "Markdown",
						Spec: PluginSpec{Text: "mysupertext"},
					},
				},
			},
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.sdkResult, test.expectedResult)
		})
	}
}
