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

// this file gathers functions for common needs in tests

package test

import (
	"encoding/json"
	"os"
	"os/exec"
	"strings"

	"gopkg.in/yaml.v2"
)

// simple wrapper to json.Marshal for testing, to ensure the test gets aborted in case of error
func JSONMarshalStrict(obj interface{}) []byte {
	data, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return data
}

// simple wrapper to json.Unmarshal for testing, to ensure the test gets aborted in case of error
func JSONUnmarshal(src []byte, dst interface{}) {
	if err := json.Unmarshal(src, dst); err != nil {
		panic(err)
	}
}

// simple wrapper to yaml.Unmarshal for testing, to ensure the test gets aborted in case of error
func YAMLMarshalStrict(obj interface{}) []byte {
	data, err := yaml.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return data
}

func GetRepositoryPath() string {
	projectPathByte, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
	if err != nil {
		panic(err)
	}
	return strings.TrimSpace(string(projectPathByte))
}

// simple wrapper to os.ReadFile for testing, to ensure the test gets aborted in case of error
func ReadFile(filepath string) []byte {
	fileContentBytes, err := os.ReadFile(filepath)
	if err != nil {
		panic(err)
	}
	return fileContentBytes
}
