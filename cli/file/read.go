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

package file

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/perses/perses/cli/read"
)

func readAndDetect(file string) (data []byte, isJSON bool, err error) {
	if file == "-" {
		data, err = read.FromStdout()
	} else {
		data, err = os.ReadFile(file) //nolint
	}

	if err != nil {
		return
	}

	// detecting file format
	isJSON = json.Unmarshal(data, &json.RawMessage{}) == nil
	return
}

func newReadFileErr(err error) error {
	return fmt.Errorf("unable to read file, format invalid: %w", err)
}
