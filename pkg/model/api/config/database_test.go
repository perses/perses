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

package config

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

// The documented key for this field is the snake_case max_allowed_packet
// (see docs/configuration/configuration.md and the surrounding struct fields),
// so both the YAML and JSON tags must bind that key.
func TestSQLMaxAllowedPacketFromYAML(t *testing.T) {
	data := `
db_name: mydb
max_allowed_packet: 67108864
`
	sql := &SQL{}
	assert.NoError(t, yaml.Unmarshal([]byte(data), sql))
	assert.Equal(t, 67108864, sql.MaxAllowedPacket)
}

func TestSQLMaxAllowedPacketFromJSON(t *testing.T) {
	data := `{"db_name":"mydb","max_allowed_packet":67108864}`
	sql := &SQL{}
	assert.NoError(t, json.Unmarshal([]byte(data), sql))
	assert.Equal(t, 67108864, sql.MaxAllowedPacket)
}
