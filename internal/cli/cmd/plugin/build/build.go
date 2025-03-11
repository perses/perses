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
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

const (
	vendorDir        = "pkg"
	vendorDirBackup  = vendorDir + ".bak"
	moduleFile       = "module.cue"
	moduleFileBackup = moduleFile + ".bak"
)

type option struct {
	persesCMD.Option
	skipNPMBuild              bool
	skipNPMInstall            bool
	archiveFormat             archive.Format
	cfg                       config.PluginConfig
	initialCFG                config.PluginConfig
	cfgPath                   string
	pluginPath                string
	isSchemaRequired          bool
	schemaPathFromPackageJSON string
	moduleFilePath            string
	moduleFileBackupPath      string
	vendorDirPath             string
	vendorDirBackupPath       string
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
	o.initialCFG = cfg
	// Overriding the path with the plugin path
	o.cfg.DistPath = filepath.Join(o.pluginPath, o.cfg.DistPath)
	o.cfg.FrontendPath = filepath.Join(o.pluginPath, o.cfg.FrontendPath)
	o.cfg.SchemasPath = filepath.Join(o.pluginPath, o.cfg.SchemasPath)
	// Set the different path variables needed for the CUE part
	o.moduleFilePath = filepath.Join(o.pluginPath, plugin.CuelangModuleFolder, moduleFile)
	o.moduleFileBackupPath = filepath.Join(o.pluginPath, moduleFileBackup)
	o.vendorDirPath = filepath.Join(o.pluginPath, plugin.CuelangModuleFolder, vendorDir)
	o.vendorDirBackupPath = filepath.Join(o.pluginPath, vendorDirBackup)
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
	if err := o.executeNPMSteps(); err != nil {
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

	// If the schema is required, we need to prepare the CUE files for the archive
	if o.isSchemaRequired {
		restoreInitialState, cueErr := o.prepareCueFiles()
		if restoreInitialState != nil {
			defer restoreInitialState()
		}
		if cueErr != nil {
			return fmt.Errorf("unable to prepare the CUE files for the archive: %w", cueErr)
		}
	}

	// Finally, we create the archive.
	// The archive contains the following files:
	// - package.json: required to get the type of the plugin and the name
	// - mf-manifest.json and mf-stats.json: contains the plugin name
	// - static: folder containing the UI part
	// - schemas: folder containing the schema files
	// - cue.mod: folder containing the CUE module and possible vendored dependencies
	files, err := o.computeArchiveFiles()
	if err != nil {
		return err
	}
	if archiveBuildErr := archive.Build(filepath.Join(o.pluginPath, manifest.Name), o.archiveFormat, files); archiveBuildErr != nil {
		return fmt.Errorf("archive creation failed: %w", archiveBuildErr)
	}
	return output.HandleString(o.writer, fmt.Sprintf("%s built successfully", manifest.Name))
}

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

// prepareCueFiles "prepares" the CUE files for the plugin packaging.
// More precisely, it does the necessary to rely on the "old" modules resolution, so that the plugin archive
// is fully "self-contained" and schema evaluation doesn't need to fetch dependencies from an OCI registry.
func (o *option) prepareCueFiles() (func(), error) {
	// Check if we need to vendor the dependencies
	// - Parse the module file into a CUE instance
	ctx := cuecontext.New()
	insts := load.Instances([]string{o.moduleFilePath}, nil)
	module := ctx.BuildInstance(insts[0])
	if err := module.Err(); err != nil {
		return nil, fmt.Errorf("failed to load plugin module file: %w", err)
	}

	// - if no `deps` are present, skip vendoring
	deps := module.LookupPath(cue.ParsePath("deps"))
	if deps.Err() != nil {
		logrus.Debugf("`deps` not found, no CUE dependencies to vendor")
		return nil, nil
	}

	// Backup the original state of cue.mod/pkg if it exists*, and restore the original state on exit.
	// *: even if a given plugin relies on new dependency management, it may also rely on other dependencies
	// managed the old way. This is technically possible & supported by CUE, thus we want to handle this case.
	var restoreVendorDir func()
	if _, err := os.Stat(o.vendorDirPath); err == nil {
		if copyErr := file.CopyDir(o.vendorDirPath, o.vendorDirBackupPath); copyErr != nil {
			return nil, fmt.Errorf("failed to backup original %s: %w", o.vendorDirPath, copyErr)
		}
		restoreVendorDir = func() {
			if removeErr := os.RemoveAll(o.vendorDirPath); removeErr != nil {
				logrus.WithError(removeErr).Errorf("failed to cleanup alterated %s", o.vendorDirPath)
			}
			if renameErr := os.Rename(o.vendorDirBackupPath, o.vendorDirPath); renameErr != nil {
				logrus.WithError(renameErr).Errorf("failed to restore original %s", o.vendorDirPath)
			}
		}
	} else {
		restoreVendorDir = func() {
			if removeErr := os.RemoveAll(o.vendorDirPath); removeErr != nil {
				logrus.WithError(removeErr).Errorf("failed to cleanup %s", o.vendorDirPath)
			}
		}
	}

	// Vendor the dependencies
	if err := o.vendorCueDependencies(); err != nil {
		return restoreVendorDir, fmt.Errorf("failed to vendor CUE dependencies: %w", err)
	}

	// Alter the module file
	restoreModuleFile, err := o.alterCueModule(ctx, module)
	restore := func() {
		if restoreModuleFile != nil {
			restoreModuleFile()
		}
		restoreVendorDir()
	}

	if err != nil {
		return restore, fmt.Errorf("failed to alter module file: %w", err)
	}

	return restore, nil
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
// As we consider this constraint a no-go in our case, We looked for solutions to that problem... After asking to CUE maintainers
// it seems our long-term solution would be https://github.com/cue-lang/cue/issues/3328. For the time being we thus have to
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

	// Run `cue mod tidy` to fetch the dependencies
	cmd := exec.Command("cue", "mod", "tidy") // nolint: gosec
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	cmd.Dir = o.pluginPath // the command has to be run from the plugin path
	if cmdErr := cmd.Run(); cmdErr != nil {
		return fmt.Errorf("cue eval failed: %w, stderr: %s", cmdErr, stderr.String())
	}

	// Move dependencies to cue.mod/pkg
	// NB we copy with file.CopyDir instead of moving with os.Rename because the latter was causing issues on Windows when `pkg` already exists
	if copyErr := file.CopyDir(filepath.Join(tempDir, "mod", "extract"), o.vendorDirPath); copyErr != nil {
		return fmt.Errorf("failed to move dependencies: %w", copyErr)
	}

	// At this point, the folder structure is like: cue.mod/pkg/github.com/perses/perses/cue@vX.Y.Z
	// we need to change it to: cue.mod/pkg/github.com/perses/perses/cue in order to have the "old" modules
	// resolution working.
	// See https://cuelang.org/docs/concept/faq/new-modules-vs-old-modules/
	//
	// NB: Since "github.com/perses/perses/cue" may not be the only dependency, we walk through all
	// directories under cue.mod/pkg
	err = filepath.WalkDir(o.vendorDirPath, func(path string, d os.DirEntry, err error) error {
		logrus.Debugf("Walking through %s", path)
		if err != nil {
			return fmt.Errorf("error walking through %s: %w", path, err)
		}

		if d.IsDir() {
			// Rename the directory if it has a version in its name (e.g cue@vX.Y.Z)
			parts := strings.Split(path, "@")
			if len(parts) == 2 {
				renamedDir := parts[0]

				// Ensure we don't overwrite existing directories
				if _, osErr := os.Stat(renamedDir); !os.IsNotExist(osErr) {
					return fmt.Errorf("directory already exists: %s", renamedDir)
				}

				// Rename the directory
				if osErr := os.Rename(path, renamedDir); osErr != nil {
					return fmt.Errorf("failed to rename directory %s to %s: %w", path, renamedDir, osErr)
				}

				logrus.Debugf("Renamed %s to %s\n", path, renamedDir)
				return filepath.SkipDir
			}
		}
		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to walk through %s: %w", o.vendorDirPath, err)
	}

	return nil
}

// alterCueModule alters the module file to remove the `deps` section, so that schema evaluation will resolve
// dependencies from the local vendor dir instead of from an OCI registry.
// To achieve this we parse the module file into a Value & iteratively copy the fields, skipping the `deps` field.
// That's the easier way we can do in the current state of the CUE lib.
func (o *option) alterCueModule(ctx *cue.Context, module cue.Value) (func(), error) {
	// restore the original state when finished
	restoreInitialModule := func() {
		if err := os.Rename(o.moduleFileBackupPath, o.moduleFilePath); err != nil {
			logrus.WithError(err).Errorf("failed to restore original module file")
		}
	}

	if err := os.Rename(o.moduleFilePath, o.moduleFileBackupPath); err != nil {
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
		return restoreInitialModule, fmt.Errorf("Failed to format new module.cue: %v", err)
	}

	err = os.WriteFile(o.moduleFilePath, cueBytes, 0644) // nolint: gosec
	if err != nil {
		return restoreInitialModule, fmt.Errorf("Failed to write module.cue: %v", err)
	}

	return restoreInitialModule, nil
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
		Long: `The command will build the plugin by following these steps:
- Run npm ci to install the frontend dependencies
- Run npm run build to build the frontend
- Vendor all cue dependencies if the plugin requires a schema
- Create the archive with the following files:
  - package.json: required to get the type of the plugin and the name
  - mf-manifest.json and mf-stats.json: contains the plugin name
  - static: folder containing the UI part
  - schemas: folder containing the schema files
  - cue.mod: folder containing the CUE module & eventual vendored dependencies
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar((*string)(&o.archiveFormat), "archive-format", string(archive.TARgz), "The archive format. Supported format are: tar.gz, tar, zip")
	cmd.Flags().BoolVar(&o.skipNPMBuild, "skip.npm-build", false, "The command will run `npm run build` to ensure the frontend is built before creating the archive. If you want to skip this step, you can use this flag.")
	cmd.Flags().BoolVar(&o.skipNPMInstall, "skip.npm-install", false, "The command will run `npm ci` if it doesn't find the node_modules folder. If you want to skip this step, you can use this flag.")
	cmd.Flags().StringVar(&o.cfgPath, "config", "", "Relative path to the configuration file. It is relative, because it will use as a root path the one set with the flag ---plugin.path. By default, the command will look for a file named 'perses_plugin_config.yaml'")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the plugin. By default, the command will look at the folder where the command is running.")

	return cmd
}
