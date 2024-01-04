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

package sdk

import (
	"testing"

	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
)

func TestSecretBuilder(t *testing.T) {
	testSuites := []struct {
		title          string
		sdkResult      modelV1.Secret
		expectedResult modelV1.Secret
	}{
		{
			title:     "empty secret",
			sdkResult: NewSecret("test").Build(),
			expectedResult: modelV1.Secret{
				Kind: modelV1.KindSecret,
				Metadata: modelV1.ProjectMetadata{
					Metadata: modelV1.Metadata{
						Name: "test",
					},
				},
			},
		},
		{
			title:     "empty secret with tls insecure",
			sdkResult: NewSecret("test").EnableInsecureSkipVerify().Build(),
			expectedResult: modelV1.Secret{
				Kind: modelV1.KindSecret,
				Metadata: modelV1.ProjectMetadata{
					Metadata: modelV1.Metadata{
						Name: "test",
					},
				},
				Spec: modelV1.SecretSpec{
					TLSConfig: &secret.TLSConfig{
						InsecureSkipVerify: true,
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
