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
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalSigV4(t *testing.T) {
	testSuite := []struct {
		title     string
		jason     string
		result    SigV4
		expectErr string
	}{
		{
			title:  "default credentials",
			jason:  `{"region": "us-east-1", "serviceName": "monitoring"}`,
			result: SigV4{Region: "us-east-1", ServiceName: "monitoring"},
		},
		{
			title:  "static credentials and role",
			jason:  `{"region": "eu-west-3", "serviceName": "monitoring", "accessKey": "AKID", "secretKey": "secret", "roleArn": "arn:aws:iam::123456789012:role/perses", "externalId": "id"}`,
			result: SigV4{Region: "eu-west-3", ServiceName: "monitoring", AccessKey: "AKID", SecretKey: "secret", RoleARN: "arn:aws:iam::123456789012:role/perses", ExternalID: "id"},
		},
		{
			title:  "secret key file",
			jason:  `{"region": "us-east-1", "serviceName": "aps", "accessKey": "AKID", "secretKeyFile": "/etc/perses/aws"}`,
			result: SigV4{Region: "us-east-1", ServiceName: "aps", AccessKey: "AKID", SecretKeyFile: "/etc/perses/aws"}, //nolint:gosec // test credentials
		},
		{title: "missing region", jason: `{"serviceName": "monitoring"}`, expectErr: "region cannot be empty"},
		{title: "missing service", jason: `{"region": "us-east-1"}`, expectErr: "serviceName cannot be empty"},
		{title: "access key without secret key", jason: `{"region": "us-east-1", "serviceName": "monitoring", "accessKey": "AKID"}`, expectErr: "configured together"},
		{title: "secret key without access key", jason: `{"region": "us-east-1", "serviceName": "monitoring", "secretKey": "secret"}`, expectErr: "configured together"},
		{title: "secret key and file", jason: `{"region": "us-east-1", "serviceName": "monitoring", "accessKey": "AKID", "secretKey": "secret", "secretKeyFile": "/f"}`, expectErr: "at most one"},
		{title: "external ID without role", jason: `{"region": "us-east-1", "serviceName": "monitoring", "externalId": "id"}`, expectErr: "only be used with roleArn"},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			jsonResult := SigV4{}
			jsonErr := json.Unmarshal([]byte(test.jason), &jsonResult)
			// JSON is valid YAML.
			yamlResult := SigV4{}
			yamlErr := yaml.Unmarshal([]byte(test.jason), &yamlResult)
			if len(test.expectErr) > 0 {
				assert.ErrorContains(t, jsonErr, test.expectErr)
				assert.ErrorContains(t, yamlErr, test.expectErr)
				return
			}
			require.NoError(t, jsonErr)
			require.NoError(t, yamlErr)
			assert.Equal(t, test.result, jsonResult)
			assert.Equal(t, test.result, yamlResult)
		})
	}
}

func TestSigV4GetSecretKey(t *testing.T) {
	file := filepath.Join(t.TempDir(), "secret-key")
	require.NoError(t, os.WriteFile(file, []byte("from-file"), 0o600))

	secretKey, err := (&SigV4{SecretKey: "inline"}).GetSecretKey()
	require.NoError(t, err)
	assert.Equal(t, "inline", secretKey)

	secretKey, err = (&SigV4{SecretKeyFile: file}).GetSecretKey()
	require.NoError(t, err)
	assert.Equal(t, "from-file", secretKey)

	_, err = (&SigV4{SecretKeyFile: filepath.Join(t.TempDir(), "missing")}).GetSecretKey()
	assert.Error(t, err)
}

func TestNewPublicSigV4HidesSecretKey(t *testing.T) {
	data, err := json.Marshal(NewPublicSigV4(&SigV4{Region: "us-east-1", ServiceName: "monitoring", AccessKey: "AKID", SecretKey: "secret"})) //nolint:gosec
	require.NoError(t, err)
	assert.NotContains(t, string(data), `"secret"`)
	assert.Contains(t, string(data), `"accessKey":"AKID"`)
	assert.Nil(t, NewPublicSigV4(nil))
}
