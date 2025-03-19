// Copyright 2025 The Perses Authors
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

package build

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func (o *option) executeNPMSteps() error {
	if err := o.executeNPMInstall(); err != nil {
		return err
	}
	return o.executeNPMBuild()
}

func (o *option) executeNPMInstall() error {
	if o.skipNPMInstall {
		return nil
	}
	if _, err := os.Stat(filepath.Join(o.cfg.FrontendPath, "node_modules")); os.IsNotExist(err) {
		// Then run `npm ci` to install the dependencies
		cmd := exec.Command("npm", "ci")
		cmd.Dir = o.cfg.FrontendPath
		// to get a more comprehensive error message, we need to capture the stdout & stderr.
		var stdoutBuffer bytes.Buffer
		cmd.Stdout = &stdoutBuffer
		var stderrBuffer bytes.Buffer
		cmd.Stderr = &stderrBuffer
		cmd.Dir = o.cfg.FrontendPath
		if execErr := cmd.Run(); execErr != nil {
			return fmt.Errorf("unable to install the frontend dependencies: %w, stdout: %s, stderr: %s", execErr, stdoutBuffer.String(), stderrBuffer.String())
		}
	}
	return nil
}

func (o *option) executeNPMBuild() error {
	if o.skipNPMBuild {
		return nil
	}
	cmd := exec.Command("npm", "run", "build")
	// to get a more comprehensive error message, we need to capture the stdout & stderr.
	var stdoutBuffer bytes.Buffer
	cmd.Stdout = &stdoutBuffer
	var stderrBuffer bytes.Buffer
	cmd.Stderr = &stderrBuffer
	cmd.Dir = o.cfg.FrontendPath
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("unable to build the frontend: %w, stdout: %s, stderr: %s", err, stdoutBuffer.String(), stderrBuffer.String())
	}
	return nil
}
