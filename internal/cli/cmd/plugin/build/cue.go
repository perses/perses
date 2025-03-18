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
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/load"
	"github.com/perses/perses/internal/cli/file"
	"github.com/sirupsen/logrus"
)

const (
	vendorDir        = "pkg"
	vendorDirBackup  = vendorDir + ".bak"
	moduleFile       = "module.cue"
	moduleFileBackup = moduleFile + ".bak"
)

// cacheDir is partially inspired from the CUE source code available at https://github.com/cue-lang/cue/blob/c479844b8d7a75403ab488080e7ba7808b5caaa2/internal/cueconfig/config.go#L67-L76
// The code has been copied and adapted as we cannot import code from the internal package.
func cacheDir() (string, error) {
	if dir := os.Getenv("CUE_CACHE_DIR"); dir != "" {
		return dir, nil
	}
	dir, err := os.UserCacheDir()
	if err != nil {
		return "", fmt.Errorf("cannot determine system cache directory: %v", err)
	}
	return filepath.Join(dir, "cue"), nil
}

type cueDep struct {
	// moduleName is the name of the module (e.g github.com/perses/perses/cue@v0)
	moduleName               string
	modulePathInCueCaching   string
	modulePathWithoutVersion string
	version                  string
}

func (d *cueDep) generateModulePath() error {
	p := d.moduleName
	if filepath.Separator != '/' {
		p = strings.Replace(d.moduleName, "/", string(filepath.Separator), -1)
	}
	parts := strings.Split(p, "@")
	if len(parts) != 2 {
		return fmt.Errorf("invalid module name %s", d.moduleName)
	}
	d.modulePathWithoutVersion = parts[0]
	d.modulePathInCueCaching = fmt.Sprintf("%s@%s", parts[0], d.version)
	return nil
}

type cueVendor struct {
	pluginPath           string
	moduleFilePath       string
	moduleFileBackupPath string
	vendorDirPath        string
}

// vendorCueDependencies does a home-made vendoring of CUE dependencies
// ---
// Full explanation:
//
// Following the move to CUE native dependency management, the deps of the plugin are no longer vendored under cue.mod/pkg.
// Letting things in this state would imply that, at runtime, the Perses server should have access to an OCI registry - thus
// either access to the internet OR to a custom registry set up by users in their private network - to be able to evaluate a plugin
// schema that imports packages - like the `common` package of Perses.
//
// As we consider this constraint a no-go in our case, we asked to CUE maintainers.
// It seems our long-term solution would be https://github.com/cue-lang/cue/issues/3328. For the time being, we thus have to
// reproduce the vendoring structure of the "old modules" (https://cuelang.org/docs/concept/faq/new-modules-vs-old-modules/) with
// custom code.
//
// More precisely, the steps are:
// - Parse the module.cue file containing the dependencies
// - if no `deps` are present, skip vendoring
// - if there is already a vendor directory, skip vendoring
// - Loop over the dependencies and for each:
//   - Look if the dependency is already present in the CUE cache
//   - If not, download the dependency
//   - Copy the dependency from the CUE cache to the vendor directory. During this process, we remove the version in the name of the last directory generated from the module path (= rename `cue@vX.Y.Z` to `cue`)
//
// - Once all dependencies have been copied, we are modifying the module file to remove the `deps` section, so that schema evaluation will resolve dependencies from the local vendor dir instead of from an OCI registry.
func (c *cueVendor) vendorCueDependencies() (func(), error) {
	exist, err := file.Exists(c.vendorDirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to check if %s exists: %w", c.vendorDirPath, err)
	}
	if exist {
		// Then, there is already a vendor directory.
		// To avoid collision and merge issue by importing the data from the Cuelang cache to vendor directory,
		// we are considering that the current vendor directory already contains all required deps.
		return nil, nil
	}
	deps, moduleInstance := c.getDependency()
	if len(deps) == 0 {
		// There is no dependency to vendor, we can skip this step
		return nil, nil
	}

	cueCacheDir, err := cacheDir()
	if err != nil {
		return nil, err
	}
	cueCacheDir = filepath.Join(cueCacheDir, "mod", "extract")
	cleanUpFunc := func() {
		if removeErr := os.RemoveAll(c.vendorDirPath); removeErr != nil {
			logrus.WithError(removeErr).Errorf("failed to cleanup %s", c.vendorDirPath)
		}
	}

	for _, dep := range deps {
		depExist, depErr := file.Exists(filepath.Join(cueCacheDir, dep.modulePathInCueCaching))
		if depErr != nil {
			return cleanUpFunc, fmt.Errorf("failed to check if %s exists: %w", dep.modulePathInCueCaching, depErr)
		}
		if !depExist {
			if downloadErr := c.downloadCueDeps(); downloadErr != nil {
				return cleanUpFunc, downloadErr
			}
		}
		// At this point, all dependencies have been downloaded. So we can copy the content of the CUE cache to the vendor directory.
		// First, we need to create the dependency folder in the vendor directory.
		if mkdirErr := os.MkdirAll(filepath.Join(c.vendorDirPath, dep.modulePathWithoutVersion), 0777); mkdirErr != nil {
			return cleanUpFunc, fmt.Errorf("failed to create directory %s: %w", dep.modulePathWithoutVersion, mkdirErr)
		}
		// Then, we copy the content of the CUE cache to the target directory created above.
		if copyErr := file.CopyDir(filepath.Join(cueCacheDir, dep.modulePathInCueCaching), filepath.Join(c.vendorDirPath, dep.modulePathWithoutVersion)); copyErr != nil {
			return cleanUpFunc, fmt.Errorf("failed to copy the dependency %q", dep.modulePathWithoutVersion)
		}
	}
	// At this point, all dependencies have been copied. We can now remove the `deps` section from the module file.
	restoreModuleFileFunc, err := c.alterCueModule(moduleInstance)
	restoreFunc := func() {
		if restoreModuleFileFunc != nil {
			restoreModuleFileFunc()
		}
		cleanUpFunc()
	}
	return restoreFunc, err
}

func (c *cueVendor) downloadCueDeps() error {
	cmd := exec.Command("cue", "mod", "tidy") // nolint: gosec
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	cmd.Dir = c.pluginPath // the command has to be run from the plugin path
	if cmdErr := cmd.Run(); cmdErr != nil {
		return fmt.Errorf("cue mod tidy failed: %w, stderr: %s", cmdErr, stderr.String())
	}
	return nil
}

func (c *cueVendor) getDependency() ([]cueDep, *build.Instance) {
	ctx := cuecontext.New()
	instance := load.Instances([]string{c.moduleFilePath}, nil)
	module := ctx.BuildInstance(instance[0])
	deps := module.LookupPath(cue.ParsePath("deps"))
	if deps.Err() != nil {
		logrus.WithError(deps.Err()).Debugf("`deps` not found, no CUE dependencies to vendor")
		return nil, nil
	}
	if deps.Kind() != cue.StructKind {
		logrus.Debugf("`deps` is not a CUE dependency")
		return nil, nil
	}
	var depList []cueDep
	it, _ := deps.Fields()
	for it.Next() {
		moduleName := it.Selector()
		if moduleName.LabelType() != cue.StringLabel {
			logrus.Debugf("module name %s is not a string", moduleName)
			continue
		}
		moduleValue := it.Value()
		if moduleValue.Kind() != cue.StructKind {
			logrus.Debugf("module %s is not a struct", moduleName)
			continue
		}
		version := moduleValue.LookupPath(cue.ParsePath("v"))
		if version.Err() != nil || version.Kind() != cue.StringKind {
			logrus.Debugf("version not found for module %s", moduleName)
			continue
		}
		versionAsString, _ := version.String()
		d := cueDep{
			moduleName: moduleName.Unquoted(),
			version:    versionAsString,
		}
		if err := d.generateModulePath(); err != nil {
			logrus.Debug(err)
			continue
		}
		depList = append(depList, d)
	}
	return depList, instance[0]
}

// alterCueModule alters the module file to remove the `deps` section, so that schema evaluation will resolve
// dependencies from the local vendor dir instead of from an OCI registry.
// To achieve this, we parse the module file into a Value & iteratively copy the fields, skipping the `deps` field.
// That's the easier way we can do in the current state of the CUE lib.
func (c *cueVendor) alterCueModule(moduleInstance *build.Instance) (func(), error) {
	ctx := cuecontext.New()
	module := ctx.BuildInstance(moduleInstance)
	// restore the original state when finished
	restoreInitialModule := func() {
		if err := os.Rename(c.moduleFileBackupPath, c.moduleFilePath); err != nil {
			logrus.WithError(err).Errorf("failed to restore original module file")
		}
	}

	if err := os.Rename(c.moduleFilePath, c.moduleFileBackupPath); err != nil {
		return restoreInitialModule, fmt.Errorf("failed to backup original module file: %v", err)
	}

	newModule := ctx.CompileString("{}")
	iter, _ := module.Fields()
	for iter.Next() {
		if iter.Selector().String() == "deps" {
			continue
		}
		newModule = newModule.FillPath(cue.MakePath(iter.Selector()), iter.Value())
	}

	cueBytes, err := format.Node(newModule.Syntax())
	if err != nil {
		return restoreInitialModule, fmt.Errorf("failed to format new module.cue: %v", err)
	}

	err = os.WriteFile(c.moduleFilePath, cueBytes, 0644) // nolint: gosec
	if err != nil {
		return restoreInitialModule, fmt.Errorf("failed to write module.cue: %v", err)
	}

	return restoreInitialModule, nil
}
