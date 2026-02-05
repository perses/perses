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
	"testing"

	"github.com/stretchr/testify/assert"
)

// We make this test just to ensure that the metadata validation is not called.
// It makes no sense in reality.
func TestUnmarshal_PublicGlobalSecret_SpecialCharName(t *testing.T) {
	jsonData := []byte(`{
		"kind": "GlobalSecret",
		"metadata": {
			"name": "system:serviceaccount:perses:user",
			"createdAt": "2024-01-01T00:00:00Z",
			"updatedAt": "2024-01-01T00:00:00Z",
			"version": 1
		},
		"spec": {
			"basic_auth": {
				"username": "user",
				"password": "<secret>"
			}
		}
	}`)

	var secret PublicGlobalSecret
	err := json.Unmarshal(jsonData, &secret)
	assert.NoError(t, err, "Unmarshal should not fail for secret name invalid")
	assert.Equal(t, "system:serviceaccount:perses:user", secret.GetMetadata().GetName())
}

// We make this test just to ensure that the metadata validation is not called.
// It makes no sense in reality.
func TestUnmarshal_PublicSecret_SpecialCharName(t *testing.T) {
	jsonData := []byte(`{
		"kind": "Secret",
		"metadata": {
            "project": "default",
			"name": "system:serviceaccount:perses:user",
			"createdAt": "2024-01-01T00:00:00Z",
			"updatedAt": "2024-01-01T00:00:00Z",
			"version": 1
		},
		"spec": {
			"basic_auth": {
				"username": "user",
				"password": "<secret>"
			}
		}
	}`)

	var secret PublicSecret
	err := json.Unmarshal(jsonData, &secret)
	assert.NoError(t, err, "Unmarshal should not fail for secret name invalid")
	assert.Equal(t, "system:serviceaccount:perses:user", secret.GetMetadata().GetName())
}
