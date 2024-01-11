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

package common

import (
	"encoding/json"
	"net/url"
	"os"
	"testing"

	"github.com/nexucis/lamenv"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

type testURLStruct struct {
	URL URL `json:"url" yaml:"url"`
}

func TestURL_YAML(t *testing.T) {
	c := &testURLStruct{}
	err := yaml.Unmarshal([]byte(`url: http://localhost:8080`), c)
	assert.NoError(t, err)
	u, _ := url.Parse("http://localhost:8080")
	assert.Equal(t, c, &testURLStruct{URL: URL{URL: u}})
	res, err := yaml.Marshal(c)
	assert.NoError(t, err)
	assert.Contains(t, string(res), `url: http://localhost:8080`)

}
func TestURL_JSON(t *testing.T) {
	c := &testURLStruct{}
	err := json.Unmarshal([]byte(`{"url": "http://localhost:8080"}`), c)
	assert.NoError(t, err)
	u, _ := url.Parse("http://localhost:8080")
	assert.Equal(t, c, &testURLStruct{URL: URL{URL: u}})
	res, err := json.Marshal(c)
	assert.NoError(t, err)
	assert.Equal(t, string(res), `{"url":"http://localhost:8080"}`)
}

func TestURL_ENV(t *testing.T) {
	_ = os.Setenv("PREFIX_URL", "http://localhost:8080")
	c := &testURLStruct{}
	err := lamenv.Unmarshal(c, []string{"PREFIX"})
	assert.NoError(t, err)
	u, _ := url.Parse("http://localhost:8080")
	assert.Equal(t, c, &testURLStruct{URL: URL{URL: u}})
	err = lamenv.Marshal(c, []string{"PREFIX"})
	assert.NoError(t, err)
	assert.Equal(t, os.Getenv("PREFIX_URL"), `http://localhost:8080`)
	_ = os.Unsetenv("PREFIX_URL")
}
