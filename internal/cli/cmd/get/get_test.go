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
	"testing"

	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/stretchr/testify/assert"
)

func TestGetCMD(t *testing.T) {
	testSuite := []struct {
		title           string
		args            []string
		expectedMessage string
		isErrorExpected bool
	}{
		{
			title:           "empty args",
			args:            []string{},
			isErrorExpected: true,
			expectedMessage: cmdUtils.FormatAvailableResourcesMessage(),
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			cmd := NewCMD()
			buffer := bytes.NewBufferString("")
			cmd.SetOut(buffer)
			cmd.SetErr(buffer)
			cmd.SetArgs(test.args)

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
