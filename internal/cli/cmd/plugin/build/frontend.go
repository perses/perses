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

package build

import (
	"bytes"
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/packagemanager"
)

func (o *option) executeFrontendSteps() error {
	pm := packagemanager.Detect(o.cfg.FrontendPath)
	if err := o.executeFrontendInstall(pm); err != nil {
		return err
	}
	return o.executeFrontendBuild(pm)
}

func (o *option) executeFrontendInstall(pm packagemanager.PackageManager) error {
	if o.skipFrontendInstall {
		return nil
	}
	exist, err := file.Exists(filepath.Join(o.cfg.FrontendPath, "node_modules"))
	if err != nil {
		return fmt.Errorf("unable to check if node_modules exists: %w", err)
	}
	if exist {
		// If the node_modules folder already exists, we do not need to install the dependencies
		return nil
	}
	// If the node_modules folder does not exist, perhaps it is in the root folder because this is a workspace / monorepo.
	// We check if the node_modules folder exists in the root folder.
	// If it does not exist, we will install the dependencies with the detected package manager.
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
	if err := runPackageManager(pm, o.cfg.FrontendPath, pm.InstallArgs()...); err != nil {
		return fmt.Errorf("unable to install the frontend dependencies with %s: %w", pm, err)
	}
	return nil
}

func (o *option) executeFrontendBuild(pm packagemanager.PackageManager) error {
	if o.skipFrontendBuild {
		return nil
	}
	if err := runPackageManager(pm, o.cfg.FrontendPath, pm.RunArgs("build")...); err != nil {
		return fmt.Errorf("unable to build the frontend with %s: %w", pm, err)
	}
	return nil
}

func runPackageManager(pm packagemanager.PackageManager, dir string, args ...string) error {
	cmd := exec.Command(string(pm.Name), args...) //nolint:gosec
	cmd.Dir = dir
	// to get a more comprehensive error message, we need to capture the stdout & stderr.
	var stdoutBuffer bytes.Buffer
	cmd.Stdout = &stdoutBuffer
	var stderrBuffer bytes.Buffer
	cmd.Stderr = &stderrBuffer
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("%w, stdout: %s, stderr: %s", err, stdoutBuffer.String(), stderrBuffer.String())
	}
	return nil
}
