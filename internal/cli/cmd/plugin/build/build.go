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
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/format"
	"cuelang.org/go/cue/load"
	"github.com/mholt/archives"
	"github.com/perses/perses/internal/api/archive"
	"github.com/perses/perses/internal/api/plugin"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/cmd/plugin/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

const (
	moduleBackupFile = "module.cue.bak"
)

var (
	vendorDir  = filepath.Join("cue.mod", "pkg")
	moduleFile = filepath.Join("cue.mod", "module.cue")
)

type option struct {
	persesCMD.Option
	skipNPMBuild              bool
	archiveFormat             archive.Format
	cfg                       config.PluginConfig
	cfgPath                   string
	pluginPath                string
	isSchemaRequired          bool
	schemaPathFromPackageJSON string
	writer                    io.Writer
	errWriter                 io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'build'")
	}
	cfg, err := config.Resolve(o.pluginPath, o.cfgPath)
	if err != nil {
		return fmt.Errorf("unable to resolve the configuration: %w", err)
	}
	o.cfg = cfg
	// Overriding the path with the plugin path
	o.cfg.DistPath = filepath.Join(o.pluginPath, o.cfg.DistPath)
	o.cfg.FrontendPath = filepath.Join(o.pluginPath, o.cfg.FrontendPath)
	o.cfg.SchemasPath = filepath.Join(o.pluginPath, o.cfg.SchemasPath)
	return nil
}

func (o *option) Validate() error {
	if !archive.IsValidFormat(o.archiveFormat) {
		return fmt.Errorf("archive format %q not managed", o.archiveFormat)
	}
	return nil
}

func (o *option) Execute() error {
	// First step: run npm to build the frontend part.
	if err := o.executeNPMBuild(); err != nil {
		return err
	}
	// Check if the required files are present
	if err := plugin.IsRequiredFileExists(o.cfg.FrontendPath, o.cfg.SchemasPath, o.cfg.DistPath); err != nil {
		return fmt.Errorf("required files are missing: %w", err)
	}
	npmPackageData, readErr := plugin.ReadPackage(o.cfg.FrontendPath)
	if readErr != nil {
		return fmt.Errorf("unable to read plugin package.json: %w", readErr)
	}
	if o.isSchemaRequired = plugin.IsSchemaRequired(npmPackageData.Perses); o.isSchemaRequired {
		if _, err := os.Stat(filepath.Join(o.pluginPath, plugin.CuelangModuleFolder)); os.IsNotExist(err) {
			return errors.New("cue modules not found")
		}
	}
	o.schemaPathFromPackageJSON = npmPackageData.Perses.SchemasPath
	// Get the plugin name from the manifest file
	manifest, err := plugin.ReadManifest(o.cfg.DistPath)
	if err != nil {
		return fmt.Errorf("unable to read manifest: %w", err)
	}

	// Check if we need to vendor the dependencies:
	// - Parse the module file into a CUE instance
	ctx := cuecontext.New()
	insts := load.Instances([]string{moduleFile}, nil)
	module := ctx.BuildInstance(insts[0])
	if err := module.Err(); err != nil {
		return fmt.Errorf("failed to load plugin module file: %w", err)
	}

	// - if no `deps` are present, skip vendoring
	deps := module.LookupPath(cue.ParsePath("deps"))
	if deps.Err() != nil {
		logrus.Debugf("`deps` not found, no CUE dependencies to vendor")
	} else {
		// Vendor the dependencies
		if err := o.vendorCueDependencies(); err != nil {
			return fmt.Errorf("failed to vendor CUE dependencies: %w", err)
		}
		// restore the original state on exit
		defer func() {
			if err := os.RemoveAll(vendorDir); err != nil {
				logrus.Printf("failed to cleanup %s: %v", vendorDir, err)
			}
		}()

		// Alter the module file to remove the deps section. To achieve this we iteratively copy its content
		// into a new value except the `deps` field. That's the easier way we can do in the current state of
		// the CUE lib.
		if err := os.Rename(moduleFile, moduleBackupFile); err != nil {
			return fmt.Errorf("failed to backup original module file: %v", err)
		}
		// restore the original state on exit
		defer func() {
			if err := os.Rename(moduleBackupFile, moduleFile); err != nil {
				logrus.Printf("failed to restore original module file: %v", err)
			}
		}()

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
			return fmt.Errorf("Failed to format new module.cue: %v", err)
		}

		err = os.WriteFile(moduleFile, cueBytes, 0644) // nolint: gosec
		if err != nil {
			return fmt.Errorf("Failed to write module.cue: %v", err)
		}
	}

	// Finally, we create the archive.
	// The archive contains the following files:
	// - package.json: required to get the type of the plugin and the name
	// - mf-manifest.json and mf-stats.json: contains the plugin name
	// - static: folder containing the UI part
	// - schemas: folder containing the schema files
	// - cue.mod: folder containing the CUE module & eventual vendored dependencies
	files, err := o.computeArchiveFiles()
	if err != nil {
		return err
	}
	if archiveBuildErr := archive.Build(filepath.Join(o.pluginPath, manifest.Name), o.archiveFormat, files); archiveBuildErr != nil {
		return fmt.Errorf("archive creation failed: %w", archiveBuildErr)
	}
	return output.HandleString(o.writer, fmt.Sprintf("%s built successfully", manifest.Name))
}

func (o *option) executeNPMBuild() error {
	if o.skipNPMBuild {
		return nil
	}
	if _, err := os.Stat(filepath.Join(o.cfg.FrontendPath, "node_modules")); os.IsNotExist(err) {
		// Then run `npm ci` to install the dependencies
		cmd := exec.Command("npm", "ci")
		cmd.Dir = o.cfg.FrontendPath
		// to get a more comprehensive error message, we need to capture the stdout.
		var stdoutBuffer bytes.Buffer
		cmd.Stdout = &stdoutBuffer
		cmd.Dir = o.cfg.FrontendPath
		if execErr := cmd.Run(); execErr != nil {
			return fmt.Errorf("unable to install the frontend dependencies: %w, stderr: %s", execErr, stdoutBuffer.String())
		}
	}
	cmd := exec.Command("npm", "run", "build")
	// to get a more comprehensive error message, we need to capture the stdout.
	var stdoutBuffer bytes.Buffer
	cmd.Stdout = &stdoutBuffer
	cmd.Dir = o.cfg.FrontendPath
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("unable to build the frontend: %w, stderr: %s", err, stdoutBuffer.String())
	}
	return nil
}

// Home-made vendoring of CUE dependencies
// ---
// Full explanation:
//
// Following the move to CUE native dependency management, the deps of the plugin are no longer vendored under cue.mod/pkg.
// Letting things in this state would imply that, at runtime, the Perses server should have access to an OCI registry - thus
// either access to internet OR to a custom registry set up by users in their private network - to be able to evaluate a plugin
// schema that imports packages - like the `common` package of Perses.
//
// As we consider this constraint a no-go in our case, We looked for solutions to that problem... After asking to CUE maintainers
// it seems our long term solution would be https://github.com/cue-lang/cue/issues/3328. For the time being we thus have to
// reproduce the vendoring structure of the "old modules" (https://cuelang.org/docs/concept/faq/new-modules-vs-old-modules/) with
// custom code.
//
// More precisely the steps are:
// - set the `CUE_CACHE_DIR` env var to a local temp folder
// - evaluate the schemas to trigger the retrieval of dependencies
// - move the dependencies to `cue.mod/pkg`
// - remove the version in the name of the last directory generated from the module path (= rename `cue@vX.Y.Z` to `cue`)
func (o *option) vendorCueDependencies() error {
	// Define a temporary folder where to store the CUE dependencies
	tempDir, err := os.MkdirTemp("", "cue_cache")
	if err != nil {
		return fmt.Errorf("failed to create temp directory for CUE cache: %w", err)
	}
	defer os.RemoveAll(tempDir) // Ensure cleanup
	if err := os.Setenv("CUE_CACHE_DIR", tempDir); err != nil {
		return fmt.Errorf("failed to set CUE_CACHE_DIR: %w", err)
	}

	// Run `cue eval` in order to fetch the dependencies
	// NB forcing `./` to be appended here to workaround this limitation: 'standard library import path "schemas" cannot be imported as a CUE package'
	cmd := exec.Command("cue", "eval", strings.Join([]string{".", "schemas"}, string(os.PathSeparator))) // nolint: gosec
	cmd.Stderr = o.errWriter
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("cue eval failed: %w", err)
	}

	// Move dependencies to cue.mod/pkg
	err = os.Rename(filepath.Join(tempDir, "mod", "extract"), vendorDir)
	if err != nil {
		return fmt.Errorf("failed to move dependencies: %w", err)
	}

	// At this point the folder structure is like: cue.mod/pkg/github.com/perses/perses/cue@vX.Y.Z
	// we need to change it to: cue.mod/pkg/github.com/perses/perses/cue in order to have the "old" modules
	// resolution working.
	// See https://cuelang.org/docs/concept/faq/new-modules-vs-old-modules/
	//
	// NB: Since "github.com/perses/perses/cue" may not be the only dependency, we walk through all
	// directories under cue.mod/pkg
	err = filepath.WalkDir(vendorDir, func(path string, d os.DirEntry, err error) error {
		logrus.Debugf("Walking through %s", path)
		if err != nil {
			return fmt.Errorf("error walking through directory %s: %w", path, err)
		}

		if d.IsDir() {
			// Rename the directory if it has a version in its name (e.g cue@vX.Y.Z)
			parts := strings.Split(path, "@")
			if len(parts) == 2 {
				renamedDir := parts[0]

				// Ensure we don't overwrite existing directories
				if _, err := os.Stat(renamedDir); !os.IsNotExist(err) {
					return fmt.Errorf("directory already exists: %s", renamedDir)
				}

				// Rename the directory
				if err := os.Rename(path, renamedDir); err != nil {
					return fmt.Errorf("failed to rename directory %s to %s: %w", path, renamedDir, err)
				}

				logrus.Debugf("Renamed %s to %s\n", path, renamedDir)
				return filepath.SkipDir
			}
		}
		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to walk through cue.mod/pkg: %w", err)
	}

	return nil
}

func (o *option) computeArchiveFiles() ([]archives.FileInfo, error) {
	list := make(map[string]string)
	// add README and LICENSE if they are present as they are optional
	const readme = "README.md"
	if _, err := os.Stat(filepath.Join(o.pluginPath, readme)); err == nil {
		list[filepath.Join(o.pluginPath, readme)] = readme
	}
	const license = "LICENSE"
	if _, err := os.Stat(filepath.Join(o.pluginPath, license)); err == nil {
		list[filepath.Join(o.pluginPath, license)] = license
	}
	// add the package.json file required to get the type of the plugin.
	list[filepath.Join(o.cfg.FrontendPath, plugin.PackageJSONFile)] = plugin.PackageJSONFile

	// Add the dist content at the root of the archive (saying differently, dist folder should not appear in the archive)
	distFiles, err := os.ReadDir(o.cfg.DistPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read 'dist' directory: %w", err)
	}
	for _, f := range distFiles {
		list[filepath.Join(o.cfg.DistPath, f.Name())] = f.Name()
	}

	// Do the same for the Cuelang schemas
	if o.isSchemaRequired {
		cueFiles, schemaReadErr := os.ReadDir(o.cfg.SchemasPath)
		if schemaReadErr != nil {
			return nil, fmt.Errorf("unable to read 'schema' directory: %w", schemaReadErr)
		}
		for _, f := range cueFiles {
			list[filepath.Join(o.cfg.SchemasPath, f.Name())] = path.Join(o.schemaPathFromPackageJSON, f.Name())
		}

		// Add the cue.mod folder at the root of the archive
		list[filepath.Join(o.pluginPath, plugin.CuelangModuleFolder)] = plugin.CuelangModuleFolder
	}

	return archives.FilesFromDisk(context.Background(), nil, list)
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "build",
		Short: "Build the plugin.",
		Long:  `Build the plugin by running "npm run build" and then by creating the archive containing every required files`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar((*string)(&o.archiveFormat), "archive-format", string(archive.TARgz), "The archive format. Supported format are: tar.gz, tar, zip")
	cmd.Flags().BoolVar(&o.skipNPMBuild, "skip-npm-build", false, "")
	cmd.Flags().StringVar(&o.cfgPath, "config", "", "Relative path to the configuration file. It is relative, because it will use as a root path the one set with the flag ---plugin.path. By default, the command will look for a file named 'perses_plugin_config.yaml'")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the plugin. By default, the command will look at the folder where the command is running.")

	return cmd
}
