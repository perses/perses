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
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"

	"github.com/mholt/archives"
	"github.com/perses/perses/internal/api/archive"
	"github.com/perses/perses/internal/api/plugin"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/cmd/plugin/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/spf13/cobra"
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
	cueVendor                 *cueVendor
	writer                    io.Writer
	errWriter                 io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'plugin build'")
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
	o.cueVendor = &cueVendor{
		pluginPath:           o.pluginPath,
		moduleFilePath:       filepath.Join(o.pluginPath, plugin.CuelangModuleFolder, moduleFile),
		moduleFileBackupPath: filepath.Join(o.pluginPath, moduleFileBackup),
		vendorDirPath:        filepath.Join(o.pluginPath, plugin.CuelangModuleFolder, vendorDir),
	}
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
		restoreInitialState, cueErr := o.cueVendor.vendorCueDependencies()
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
	if archiveBuildErr := archive.Build(filepath.Join(o.pluginPath, fmt.Sprintf("%s-%s", manifest.Name, npmPackageData.Version)), o.archiveFormat, files); archiveBuildErr != nil {
		return fmt.Errorf("archive creation failed: %w", archiveBuildErr)
	}
	return output.HandleString(o.writer, fmt.Sprintf("%s built successfully", manifest.Name))
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
- Run npm ci to install the frontend dependencies. If the node_modules folder already exists, it will skip this step. As a best effort, it will also check if the node_modules folder exists in the root folder of the plugin (if it is a npm workspace / monorepo) and skip the step if it exists.
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
