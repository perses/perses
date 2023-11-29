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

package config

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func defaultConfig() Config {
	cfg, _ := Resolve("")
	return cfg
}

func TestJSONMarshallConfig(t *testing.T) {
	testSuite := []struct {
		title string
		cfg   Config
		jason string
	}{
		{
			title: "empty config",
			cfg:   Config{},
			jason: `{
  "security": {
    "readonly": false,
    "authorization": {
      "enable_authorization": false,
      "interval": "0s"
    },
    "authentication": {
      "access_token_ttl": "0s",
      "refresh_token_ttl": "0s"
    }
  },
  "database": {},
  "schemas": {
    "interval": "0s"
  },
  "provisioning": {
    "interval": "0s"
  }
}`,
		},
		{
			title: "default config",
			cfg:   defaultConfig(),
			jason: `{
  "security": {
    "readonly": false,
    "encryption_key": "\u003csecret\u003e",
    "authorization": {
      "enable_authorization": false,
      "interval": "10m0s"
    },
    "authentication": {
      "access_token_ttl": "15m0s",
      "refresh_token_ttl": "24h0m0s"
    }
  },
  "database": {
    "file": {
      "folder": "./local_db",
      "extension": "yaml"
    }
  },
  "schemas": {
    "panels_path": "schemas/panels",
    "queries_path": "schemas/queries",
    "datasources_path": "schemas/datasources",
    "variables_path": "schemas/variables",
    "interval": "1h0m0s"
  },
  "provisioning": {
    "interval": "1h0m0s"
  }
}`,
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			data, err := json.MarshalIndent(test.cfg, "", "  ")
			assert.NoError(t, err)
			assert.Equal(t, test.jason, string(data))
		})
	}
}
