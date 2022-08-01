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

package test

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/pkg/client/api"
	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func JSONMarshalStrict(obj interface{}) []byte {
	data, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return data
}

func YAMLMarshalStrict(obj interface{}) []byte {
	data, err := yaml.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return data
}

type Suite struct {
	Title           string
	Args            []string
	APIClient       api.ClientInterface
	Project         string
	ExpectedMessage string
	IsErrorExpected bool
}

func ExecuteSuiteTest(t *testing.T, newCMD func() *cobra.Command, suites []Suite) {
	for _, test := range suites {
		t.Run(test.Title, func(t *testing.T) {
			buffer := bytes.NewBufferString("")
			cmd := newCMD()
			cmd.SetOut(buffer)
			cmd.SetErr(buffer)
			cmd.SetArgs(test.Args)
			config.Global = &config.Config{
				Project: test.Project,
			}
			config.Global.SetAPIClient(test.APIClient)

			err := cmd.Execute()
			if test.IsErrorExpected {
				if assert.NotNil(t, err) {
					assert.Equal(t, test.ExpectedMessage, err.Error())
				}
			} else if assert.Nil(t, err) {
				assert.Equal(t, test.ExpectedMessage, buffer.String())
			}
		})
	}
}
