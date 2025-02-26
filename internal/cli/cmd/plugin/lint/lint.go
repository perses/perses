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
	cfg       config.PluginConfig
	cfgPath   string
	writer    io.Writer
	errWriter io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'update'")
	}
	cfg, err := config.Resolve(o.cfgPath)
	if err != nil {
		return fmt.Errorf("unable to resolve the configuration: %w", err)
	}
	o.cfg = cfg
	return nil
}

func (o *option) Validate() error {
	if err := plugin.IsRequiredFileExists(o.cfg.FrontendPath, o.cfg.SchemasPath, o.cfg.DistPath); err != nil {
		return fmt.Errorf("required files are missing: %w", err)
	}
	if _, err := os.Stat("cue.mod"); os.IsNotExist(err) {
		return errors.New("cue.mod folder not found")
	}
	return nil
}

func (o *option) Execute() error {
	npmPackageData, readErr := plugin.ReadPackage(o.cfg.FrontendPath)
	if readErr != nil {
		return fmt.Errorf("unable to read plugin package.json: %w", readErr)
	}
	if plugin.IsSchemaRequired(npmPackageData.Perses) {
		if _, err := schema.Load("", npmPackageData.Perses); err != nil {
			return err
		}
		if _, err := migrate.Load("", npmPackageData.Perses); err != nil {
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
	cmd.Flags().StringVar(&o.cfgPath, "config", "perses_plugin_config.yaml", "Path to the configuration file")

	return cmd
}
