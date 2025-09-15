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

	"gopkg.in/yaml.v3"
)

// simple wrapper to json.Marshal for testing, to ensure the test gets aborted in case of error
func JSONMarshalStrict(obj any) []byte {
	data, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return data
}

// simple wrapper to json.Unmarshal for testing, to ensure the test gets aborted in case of error
func JSONUnmarshal(src []byte, dst any) {
	if err := json.Unmarshal(src, dst); err != nil {
		panic(err)
	}
}

func JSONUnmarshalFromFile(filepath string, dst any) {
	data := ReadFile(filepath)
	JSONUnmarshal(data, dst)
}

// simple wrapper to yaml.Unmarshal for testing, to ensure the test gets aborted in case of error
func YAMLMarshalStrict(obj any) []byte {
	data, err := yaml.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return data
}

func YAMLUnmarshal(src []byte, dst any) {
	if err := yaml.Unmarshal(src, dst); err != nil {
		panic(err)
	}
}

func YAMLUnmarshalFromFile(filepath string, dst any) {
	data := ReadFile(filepath)
	YAMLUnmarshal(data, dst)
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
	fileContentBytes, err := os.ReadFile(filepath) //nolint: gosec
	if err != nil {
		panic(err)
	}
	return fileContentBytes
}
