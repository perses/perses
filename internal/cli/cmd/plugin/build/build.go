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

package build

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"

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
	skipNPMBuild  bool
	archiveFormat archive.Format
	cfg           config.PluginConfig
	cfgPath       string
	writer        io.Writer
	errWriter     io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'build'")
	}
	cfg, err := config.Resolve(o.cfgPath)
	if err != nil {
		return fmt.Errorf("unable to resolve the configuration: %w", err)
	}
	o.cfg = cfg
	return nil
}

func (o *option) Validate() error {
	if !archive.IsValidFormat(o.archiveFormat) {
		return fmt.Errorf("archive format %q not managed", o.archiveFormat)
	}
	// Check if the required files are present
	if exist, err := plugin.IsRequiredFileExists(o.cfg.FrontendPath, o.cfg.SchemasPath, o.cfg.DistPath); err != nil || !exist {
		return fmt.Errorf("required files are missing: %w", err)
	}
	if _, err := os.Stat("cue.mod"); os.IsNotExist(err) {
		return errors.New("cue modules not found")
	}
	return nil
}

func (o *option) Execute() error {
	// First step: run npm to build the frontend part.
	if !o.skipNPMBuild {
		if err := exec.Command("npm", "run", "build").Run(); err != nil {
			return fmt.Errorf("unable to build the frontend: %w", err)
		}
	}
	// Get the plugin name from the manifest file
	manifest, err := plugin.ReadManifest(o.cfg.DistPath)
	if err != nil {
		return fmt.Errorf("unable to read manifest: %w", err)
	}

	// Then we need to create the archive.
	// The archive contains the following file:
	// - package.json: required to get the type of the plugin and the name
	// - mf-manifest.json and mf-stats.json: contains the plugin name
	// - static: folder containing the UI part
	// - schemas: folder containing the schema files
	files, err := o.computeArchiveFiles()
	if err != nil {
		return err
	}
	if archiveBuildErr := archive.Build(manifest.Name, o.archiveFormat, files); archiveBuildErr != nil {
		return fmt.Errorf("archive creation failed: %w", archiveBuildErr)
	}
	return output.HandleString(o.writer, fmt.Sprintf("Building %s successfully", manifest.Name))
}

func (o *option) computeArchiveFiles() ([]archives.FileInfo, error) {
	list := make(map[string]string)
	// add README and LICENSE if they are present as they are optional
	const readme = "README.md"
	if _, err := os.Stat(readme); err == nil {
		list[readme] = readme
	}
	const license = "LICENSE"
	if _, err := os.Stat(license); err == nil {
		list[license] = license
	}
	// add the package.json file required to get the type of the plugin.
	list[path.Join(o.cfg.FrontendPath, plugin.PackageJSONFile)] = plugin.PackageJSONFile

	// Add the dist content at the root of the archive (saying differently, dist folder should not appear in the archive)
	distFiles, err := os.ReadDir(o.cfg.DistPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read 'dist' directory: %w", err)
	}
	for _, f := range distFiles {
		list[path.Join(o.cfg.DistPath, f.Name())] = f.Name()
	}

	// Do the same for the Cuelang schemas
	cueFiles, err := os.ReadDir(o.cfg.SchemasPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read 'schema' directory: %w", err)
	}
	for _, f := range cueFiles {
		list[path.Join(o.cfg.SchemasPath, f.Name())] = path.Join("schemas", f.Name())
	}

	// Add the cue.mod folder at the root of the archive
	list["cue.mod"] = ""

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
	cmd.Flags().StringVar(&o.cfgPath, "config", "perses_plugin_config.yaml", "Path to the configuration file")

	return cmd
}
