// Copyright The Perses Authors
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

package secret

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/nexucis/lamenv"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

type testSecretStruct struct {
	Secret Hidden `json:"secret" yaml:"secret"`
}

func TestSecret_YAML(t *testing.T) {
	c := &testSecretStruct{}
	err := yaml.Unmarshal([]byte(`secret: something`), c)
	assert.NoError(t, err)
	assert.Equal(t, c, &testSecretStruct{Secret: "something"})
	res, err := yaml.Marshal(c) //nolint:gosec
	assert.NoError(t, err)
	assert.Contains(t, string(res), `secret: <secret>`)

}
func TestSecret_JSON(t *testing.T) {
	c := &testSecretStruct{}
	err := json.Unmarshal([]byte(`{"secret": "something"}`), c)
	assert.NoError(t, err)
	assert.Equal(t, c, &testSecretStruct{Secret: "something"})
	res, err := json.Marshal(c) //nolint:gosec
	assert.NoError(t, err)
	assert.Equal(t, string(res), `{"secret":"\u003csecret\u003e"}`)
}

func TestSecret_ENV(t *testing.T) {
	_ = os.Setenv("PREFIX_SECRET", "something")
	c := &testSecretStruct{}
	err := lamenv.Unmarshal(c, []string{"PREFIX"})
	assert.NoError(t, err)
	assert.Equal(t, c, &testSecretStruct{Secret: "something"})
	err = lamenv.Marshal(c, []string{"PREFIX"})
	assert.NoError(t, err)
	assert.Equal(t, os.Getenv("PREFIX_SECRET"), `<secret>`)
	_ = os.Unsetenv("PREFIX_SECRET")
}

func TestAuthorization_Validate(t *testing.T) {
	missingErr := "when using authorization, credentials/credentialsFile cannot be empty"
	exclusiveErr := "at most one of authorization credentials & credentialsFile must be configured"

	testSuite := []struct {
		title    string
		jason    string
		expected *Authorization
		err      string
	}{
		{
			title: "empty authorization",
			jason: `{}`,
			err:   missingErr,
		},
		{
			title: "type-only authorization",
			jason: `{"type": "Bearer"}`,
			err:   missingErr,
		},
		{
			title:    "credentials only",
			jason:    `{"credentials": "token"}`,
			expected: &Authorization{Type: "Bearer", Credentials: "token"},
		},
		{
			title:    "credentialsFile only",
			jason:    `{"type": "Basic", "credentialsFile": "/tmp/token"}`,
			expected: &Authorization{Type: "Basic", CredentialsFile: "/tmp/token"},
		},
		{
			title: "credentials and credentialsFile",
			jason: `{"credentials": "token", "credentialsFile": "/tmp/token"}`,
			err:   exclusiveErr,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &Authorization{}
			err := json.Unmarshal([]byte(test.jason), result)
			if len(test.err) == 0 {
				assert.NoError(t, err)
				assert.Equal(t, test.expected, result)
			} else {
				assert.EqualError(t, err, test.err)
			}
		})
	}
}
