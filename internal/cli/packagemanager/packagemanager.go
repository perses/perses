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

// Package packagemanager detects which JavaScript package manager (pnpm, npm or yarn) is used by a frontend project.
package packagemanager

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type Name string

const (
	PNPM Name = "pnpm"
	NPM  Name = "npm"
	Yarn Name = "yarn"
	// Default is used when no lockfile and no package manager declaration is found.
	Default = PNPM
)

var lockFiles = []struct {
	file string
	name Name
}{
	{file: "pnpm-lock.yaml", name: PNPM},
	{file: "package-lock.json", name: NPM},
	{file: "npm-shrinkwrap.json", name: NPM},
	{file: "yarn.lock", name: Yarn},
}

type PackageManager struct {
	Name Name
	// HasLockFile is true when a lockfile matching the package manager has been found.
	HasLockFile bool
}

// InstallArgs returns the arguments to pass to the package manager to install the dependencies.
// When a lockfile is present, the install is done in frozen mode to respect it.
func (p PackageManager) InstallArgs() []string {
	if !p.HasLockFile {
		return []string{"install"}
	}
	if p.Name == NPM {
		return []string{"ci"}
	}
	return []string{"install", "--frozen-lockfile"}
}

// RunArgs returns the arguments to pass to the package manager to run the given script defined in package.json.
func (p PackageManager) RunArgs(script string) []string {
	return []string{"run", script}
}

func (p PackageManager) String() string {
	return string(p.Name)
}

// Detect returns the package manager used by the project located in dir.
// It looks in dir and then in its parent folders (to support workspaces / monorepos) for:
//   - the `packageManager` or `devEngines.packageManager` field of a package.json,
//   - a known lockfile.
//
// The first folder providing one of these wins. If nothing is found, Default is returned.
func Detect(dir string) PackageManager {
	current, err := filepath.Abs(dir)
	if err != nil {
		current = dir
	}
	for {
		if pm, ok := detectInDir(current); ok {
			return pm
		}
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}
	return PackageManager{Name: Default}
}

func detectInDir(dir string) (PackageManager, bool) {
	declared, isDeclared := readDeclaredPackageManager(dir)
	for _, lock := range lockFiles {
		if isDeclared && declared != lock.name {
			continue
		}
		if _, err := os.Stat(filepath.Join(dir, lock.file)); err == nil {
			return PackageManager{Name: lock.name, HasLockFile: true}, true
		}
	}
	if isDeclared {
		return PackageManager{Name: declared}, true
	}
	return PackageManager{}, false
}

type packageJSON struct {
	PackageManager string `json:"packageManager"`
	DevEngines     struct {
		PackageManager json.RawMessage `json:"packageManager"`
	} `json:"devEngines"`
}

type devEngine struct {
	Name string `json:"name"`
}

func readDeclaredPackageManager(dir string) (Name, bool) {
	data, err := os.ReadFile(filepath.Join(dir, "package.json")) //nolint:gosec
	if err != nil {
		return "", false
	}
	pkg := &packageJSON{}
	if json.Unmarshal(data, pkg) != nil {
		return "", false
	}
	if name, ok := parseName(pkg.PackageManager); ok {
		return name, true
	}
	if len(pkg.DevEngines.PackageManager) == 0 {
		return "", false
	}
	// devEngines.packageManager can be a single object or an array of objects.
	var engines []devEngine
	single := devEngine{}
	if json.Unmarshal(pkg.DevEngines.PackageManager, &single) == nil {
		engines = append(engines, single)
	} else if json.Unmarshal(pkg.DevEngines.PackageManager, &engines) != nil {
		return "", false
	}
	for _, engine := range engines {
		if name, ok := parseName(engine.Name); ok {
			return name, true
		}
	}
	return "", false
}

// parseName parses values like "pnpm", "pnpm@12.0.0" or "yarn@4.0.0+sha512...".
func parseName(value string) (Name, bool) {
	name, _, _ := strings.Cut(strings.TrimSpace(value), "@")
	switch Name(name) {
	case PNPM, NPM, Yarn:
		return Name(name), true
	default:
		return "", false
	}
}
