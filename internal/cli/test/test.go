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

package test

import (
	"bytes"
	"os"
	"regexp"
	"testing"

	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/pkg/client/api"
	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
)

type Suite struct {
	Title                string
	Args                 []string
	APIClient            api.ClientInterface
	Config               config.Config
	ExpectedMessage      string
	ExpectedRegexMessage string
	IsErrorExpected      bool
}

func ExecuteSuiteTest(t *testing.T, newCMD func() *cobra.Command, suites []Suite) {
	configFilePath := "./config.json"
	for _, test := range suites {
		t.Run(test.Title, func(t *testing.T) {
			buffer := bytes.NewBufferString("")
			cmd := newCMD()
			cmd.SetOut(buffer)
			cmd.SetErr(buffer)
			cmd.SetArgs(test.Args)

			config.Global = &(test.Config)
			config.Global.SetAPIClient(test.APIClient)
			config.Global.SetFilePath(configFilePath)
			if len(config.Global.Dac.OutputFolder) == 0 {
				config.Global.Dac.OutputFolder = config.DefaultOutputFolder
			}

			err := cmd.Execute()
			if test.IsErrorExpected {
				if assert.NotNil(t, err) {
					if len(test.ExpectedRegexMessage) > 0 {
						matched, _ := regexp.MatchString(test.ExpectedRegexMessage, err.Error())
						assert.True(t, matched, "Expected error message to match regex: %s", test.ExpectedRegexMessage)
					} else {
						assert.Equal(t, test.ExpectedMessage, err.Error())
					}
				}
			} else if assert.Nil(t, err) {
				assert.Equal(t, test.ExpectedMessage, buffer.String())
			}
			_ = os.Remove(configFilePath)
		})
	}
}
