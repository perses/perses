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

func TestUnmarshalUser(t *testing.T) {
	testSuite := []struct {
		title string
		jason string
	}{
		{
			title: "native provider only",
			jason: `
{
  "kind": "User",
  "metadata": {
    "name": "alice"
  },
  "spec": {
    "nativeProvider": {
      "password": "password"
    }
  }
}
`,
		},
		{
			title: "oauth providers only",
			jason: `
{
  "kind": "User",
  "metadata": {
    "name": "alice"
  },
  "spec": {
    "oauthProviders": [
      {
        "issuer": "http://localhost/openid",
        "email": "alice@example.com",
        "subject": "123456789"
      }
    ]
  }
}
`,
		},
		{
			title: "empty providers",
			jason: `
{
  "kind": "User",
  "metadata": {
    "name": "alice"
  },
  "spec": {
    "nativeProvider": {},
    "oauthProviders": []
  }
}
`,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := User{}
			assert.NoError(t, json.Unmarshal([]byte(test.jason), &result))
		})
	}
}

func TestUnmarshalUserError(t *testing.T) {
	testSuite := []struct {
		title string
		jason string
		err   error
	}{
		{
			title: "native provider and oauth providers are mutually exclusive",
			jason: `
{
  "kind": "User",
  "metadata": {
    "name": "alice"
  },
  "spec": {
    "nativeProvider": {
      "password": "password"
    },
    "oauthProviders": [
      {
        "issuer": "http://localhost/openid",
        "email": "alice@example.com",
        "subject": "123456789"
      }
    ]
  }
}
`,
			err: fmt.Errorf("nativeProvider and oauthProviders are mutually exclusive, use one of them"),
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := User{}
			assert.Equal(t, test.err, json.Unmarshal([]byte(test.jason), &result))
		})
	}
}
