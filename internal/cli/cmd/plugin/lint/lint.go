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

package lint

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/cmd/plugin/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	cfg                config.PluginConfig
	cfgPath            string
	pluginPath         string
	relativeSchemaPath string
	writer             io.Writer
	errWriter          io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'plugin lint'")
	}
	cfg, err := config.Resolve(o.pluginPath, o.cfgPath)
	if err != nil {
		return fmt.Errorf("unable to resolve the configuration: %w", err)
	}
	o.cfg = cfg
	// Overriding the path with the plugin path
	o.cfg.DistPath = filepath.Join(o.pluginPath, o.cfg.DistPath)
	o.cfg.FrontendPath = filepath.Join(o.pluginPath, o.cfg.FrontendPath)
	o.relativeSchemaPath = o.cfg.SchemasPath
	o.cfg.SchemasPath = filepath.Join(o.pluginPath, o.cfg.SchemasPath)
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	npmPackageData, readErr := plugin.ReadPackage(o.cfg.FrontendPath)
	if readErr != nil {
		return fmt.Errorf("unable to read plugin package.json: %w", readErr)
	}
	if plugin.IsSchemaRequired(npmPackageData.Perses) {
		if _, err := os.Stat(filepath.Join(o.pluginPath, plugin.CuelangModuleFolder)); os.IsNotExist(err) {
			return errors.New("cue module not found")
		}
		// There is a possibility the schema path set in package.json differ from the one set in the configuration.
		// In this case, we will use the one set in the configuration.
		// Note that the path used in the package.json is used when building the archive to put in the correct place the schemas,
		// to be able to find them later.
		npmPackageData.Perses.SchemasPath = o.relativeSchemaPath
		if _, err := schema.Load(o.pluginPath, npmPackageData.Perses); err != nil {
			return err
		}
		if _, err := migrate.Load(o.pluginPath, npmPackageData.Perses); err != nil {
			return err
		}
	}
	return output.HandleString(o.writer, "current plugin is valid")
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
		Use:   "lint",
		Short: "Validate the plugin model. To be used for plugin development purpose only.",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.cfgPath, "config", "", "Relative path to the configuration file. It is relative, because it will use as a root path the one set with the flag ---plugin.path. By default, the command will look for a file named 'perses_plugin_config.yaml'")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the plugin. By default, the command will look at the folder where the command is running.")

	return cmd
}
