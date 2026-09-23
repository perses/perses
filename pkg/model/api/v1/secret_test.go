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

package v1

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	basicAuthJSON     = `"basicAuth": {"username": "Magical", "password": "Girl"}`
	authorizationJSON = `"authorization": {"type": "Bearer", "credentials": "token"}`
	oauthJSON         = `"oauth": {"clientID": "id", "clientSecret": "secret", "tokenURL": "https://example.com/token"}`
)

func TestUnmarshalJSONSecretSpecMutuallyExclusiveAuth(t *testing.T) {
	mutuallyExclusiveErr := fmt.Errorf("basicAuth, authorization and oauth are mutually exclusive, use one of them")

	testSuite := []struct {
		title string
		jason string
		err   error
	}{
		{
			title: "only basicAuth",
			jason: fmt.Sprintf(`{%s}`, basicAuthJSON),
		},
		{
			title: "only authorization",
			jason: fmt.Sprintf(`{%s}`, authorizationJSON),
		},
		{
			title: "only oauth",
			jason: fmt.Sprintf(`{%s}`, oauthJSON),
		},
		{
			title: "basicAuth and authorization",
			jason: fmt.Sprintf(`{%s, %s}`, basicAuthJSON, authorizationJSON),
			err:   mutuallyExclusiveErr,
		},
		{
			title: "basicAuth and oauth",
			jason: fmt.Sprintf(`{%s, %s}`, basicAuthJSON, oauthJSON),
			err:   mutuallyExclusiveErr,
		},
		{
			title: "authorization and oauth",
			jason: fmt.Sprintf(`{%s, %s}`, authorizationJSON, oauthJSON),
			err:   mutuallyExclusiveErr,
		},
		{
			title: "basicAuth, authorization and oauth",
			jason: fmt.Sprintf(`{%s, %s, %s}`, basicAuthJSON, authorizationJSON, oauthJSON),
			err:   mutuallyExclusiveErr,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := &SecretSpec{}
			err := json.Unmarshal([]byte(test.jason), result)
			if test.err == nil {
				assert.NoError(t, err)
			} else {
				assert.Equal(t, test.err.Error(), err.Error())
			}
		})
	}
}
