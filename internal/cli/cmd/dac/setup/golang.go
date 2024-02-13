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

package setup

import (
	"fmt"
	"os"
	"os/exec"
)

func (o *option) setupGo() error {
	if _, err := os.Stat("go.mod"); os.IsNotExist(err) {
		return fmt.Errorf("unable to find the file 'go.mod'. Please run 'go mod init'")
	} else if err != nil {
		return err
	}

	if err := exec.Command("go", "get", fmt.Sprintf("github.com/perses/perses@%s", o.version)).Run(); err != nil { // nolint: gosec
		return fmt.Errorf("unable to get the go dependencies github.com/perses/perses@%s : %w", o.version, err)
	}
	return nil
}
