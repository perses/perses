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

package bar

import (
	"testing"

	commonSdk "github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
)

func TestPanelBuilder(t *testing.T) {
	testSuites := []struct {
		title          string
		sdkResult      common.Plugin
		expectedResult common.Plugin
	}{
		{
			title:     "default bar panel",
			sdkResult: NewPanelPlugin().Build(),
			expectedResult: common.Plugin{
				Kind: "BarChart",
				Spec: PluginSpec{
					Calculation: commonSdk.LastCalculation,
					Format: commonSdk.Format{
						Unit: commonSdk.DecimalUnit,
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
