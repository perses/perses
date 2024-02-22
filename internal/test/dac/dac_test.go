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

package migrate

import (
	"encoding/json"
	"errors"
	"testing"

	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/load"
	testUtils "github.com/perses/perses/internal/test"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/require"
)

func TestDashboardAsCodeUtilities(t *testing.T) {

	testSuite := []struct {
		title                  string
		inputCUEFile           string
		expectedOutputJSONFile string
	}{
		{
			title:                  "Nominal case - DaC def that relies on all the DaC utils provided",
			inputCUEFile:           "input.cue",
			expectedOutputJSONFile: "expected_output.json",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			context := cuecontext.New()

			buildInstances := load.Instances([]string{test.inputCUEFile}, nil)

			if len(buildInstances) != 1 {
				logrus.WithError(errors.New("the number of build instances is != 1")).Fatalf("Error loading build instance from CUE file %s", test.inputCUEFile)
			}
			buildInstance := buildInstances[0]

			// check for errors on the instances (these are typically parsing errors)
			if buildInstance.Err != nil {
				logrus.WithError(buildInstance.Err).Fatal("Error loading build instance from CUE file")
			}

			// build Value from the Instance
			value := context.BuildInstance(buildInstance)
			if value.Err() != nil {
				logrus.WithError(value.Err()).Fatal("Error creating CUE value from build instance")
			}

			// validate the value
			err := value.Validate()
			if err != nil {
				logrus.WithError(err).Fatal("Error validating CUE value")
			}

			// Compare with expected output
			actualDashboardBytes, err := json.Marshal(value)
			if err != nil {
				logrus.WithError(err).Fatal("Error marshalling actual dashboard from CUE value to JSON")
			}
			// this json unmarshall is done to ensure the dashboard passes the additional checks that may be
			// performed by the Go code
			var actualDashboard v1.Dashboard
			err = json.Unmarshal(actualDashboardBytes, &actualDashboard)
			if err != nil {
				logrus.WithError(err).Fatal("Error unmarshalling actual dashboard to Dashboard struct")
			}

			expectedDashboardBytes := testUtils.ReadFile(test.expectedOutputJSONFile)

			require.JSONEq(t, string(expectedDashboardBytes), string(actualDashboardBytes))
		})
	}
}
