// Copyright 2025 The Perses Authors
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

package sql

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestUnmarshalJSONConfig(t *testing.T) {
	testSuite := []struct {
		title     string
		jason     string
		result    Config
		expectErr bool
	}{
		{
			title: "basic config",
			jason: `
{
  "driver": "postgres",
  "host": "localhost:5432",
  "database": "test",
  "postgres": {
    "sslMode": "disable"
  }
}
`,
			result: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
				Postgres: &PostgresConfig{
					SSLMode: SSLModeDisable,
				},
			},
		},
		{
			title: "invalid SSL mode",
			jason: `
{
  "driver": "postgres",
  "host": "localhost:5432",
  "database": "test",
  "postgres": {
    "sslMode": "notreal"
  }
}
`,
			expectErr: true,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Config{}
			err := json.Unmarshal([]byte(test.jason), &result)
			if test.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, test.result, result)
			}
		})
	}
}

func TestUnmarshalYAMLConfig(t *testing.T) {
	testSuite := []struct {
		title  string
		yamele string
		result Config
	}{
		{
			title: "basic config",
			yamele: `
driver: postgres
host: localhost:5432
database: test
postgres:
  sslMode: disable
`,
			result: Config{
				Driver:   DriverPostgreSQL,
				Host:     "localhost:5432",
				Database: "test",
				Postgres: &PostgresConfig{
					SSLMode: SSLModeDisable,
				},
			},
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			result := Config{}
			assert.NoError(t, yaml.Unmarshal([]byte(test.yamele), &result))
			assert.Equal(t, test.result, result)
		})
	}
}
