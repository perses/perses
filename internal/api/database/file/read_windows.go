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

package databasefile

import (
	"errors"
	"os"
	"time"
)

func readFile(path string) ([]byte, error) {
	// A concurrent rename can briefly prevent opening the destination on
	// Windows. Retry only sharing violations; other read errors are returned.
	deadline := time.Now().Add(time.Second)
	for {
		data, err := os.ReadFile(path) //nolint:gosec // paths are validated by the DAO
		if err == nil || !errors.Is(err, errorSharingViolation) || time.Now().After(deadline) {
			return data, err
		}
		time.Sleep(10 * time.Millisecond)
	}
}
