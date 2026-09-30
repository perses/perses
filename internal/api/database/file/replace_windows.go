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
	"syscall"
	"time"
)

const errorSharingViolation syscall.Errno = 32

func replaceFile(oldPath, newPath string) error {
	// Go's Windows file readers do not share delete access. Wait briefly for
	// concurrent readers to close their handles before replacing the file.
	deadline := time.Now().Add(time.Second)
	for {
		err := os.Rename(oldPath, newPath)
		if err == nil || (!errors.Is(err, syscall.ERROR_ACCESS_DENIED) && !errors.Is(err, errorSharingViolation)) || time.Now().After(deadline) {
			return err
		}
		time.Sleep(10 * time.Millisecond)
	}
}
