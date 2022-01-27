// Copyright 2022 The Perses Authors
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

package utils

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"
)

const (
	JSONOutput = "json"
	YAMLOutput = "yaml"
)

func ValidateOutput(o string) error {
	if o != YAMLOutput && o != JSONOutput {
		return fmt.Errorf("--ouput must be %q or %q", YAMLOutput, YAMLOutput)
	}
	return nil
}

func HandleOutput(output string, obj interface{}) error {
	var data []byte
	var err error
	if output == JSONOutput {
		data, err = json.Marshal(obj)
	} else {
		data, err = yaml.Marshal(obj)
	}
	if err != nil {
		return err
	}
	fmt.Println(string(data))
	return nil
}

func HandleError(err error) {
	if err != nil {
		logrus.Error(err)
		os.Exit(1)
	}
}
