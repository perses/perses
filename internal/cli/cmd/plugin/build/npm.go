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
	"os/exec"
	"path/filepath"

	"github.com/perses/perses/internal/cli/file"
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
	exist, err := file.Exists(filepath.Join(o.cfg.FrontendPath, "node_modules"))
	if err != nil {
		return fmt.Errorf("unable to check if node_modules exists: %w", err)
	}
	if exist {
		// If the node_modules folder already exists, we do not need to run `npm ci`
		return nil
	}
	// If the node_modules folder does not exist, perhaps it is in the root folder because this is a npm workspace / monorepo.
	// We check if the node_modules folder exists in the root folder.
	// If it does not exist, we will run `npm ci` to install the dependencies
	// If it exists, we assume that the dependencies are already installed, and we do not need to do it.
	rootFolder := filepath.Dir(o.cfg.FrontendPath)
	if rootFolder == "." || rootFolder == "" {
		rootFolder = ".."
	}
	exist, err = file.Exists(filepath.Join(rootFolder, "node_modules"))
	if err != nil {
		return fmt.Errorf("unable to check if node_modules exists in the root folder: %w", err)
	}
	if exist {
		return nil
	}
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
