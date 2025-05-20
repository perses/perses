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

package list

import (
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	pluginModel "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/spf13/cobra"
)

var columnHeader = []string{
	"NAME",
	"VERSION",
	"TYPE",
	"LOADED",
	"FROM DEV",
}

type option struct {
	persesCMD.Option
	opt.OutputOption
	writer    io.Writer
	errWriter io.Writer
	client    v1.PluginInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'list'")
	}
	// Complete the output only if it has been set by the user
	// NB: In the case of the `get` command, the default output format is/should be a table, not json
	// or YAML, hence why we need to skip OutputOption.Complete() if the output flag is not set.
	if len(o.Output) > 0 {
		if outputErr := o.OutputOption.Complete(); outputErr != nil {
			return outputErr
		}
	}

	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}

	o.client = apiClient.V1().Plugin()
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	plugins, err := o.client.List()
	if err != nil {
		return err
	}
	if len(o.Output) > 0 {
		return output.Handle(o.writer, o.Output, plugins)
	}
	var matrix [][]string
	for _, plugin := range plugins {
		kind := plugin.Kind
		if len(plugin.Spec.Plugins) == 1 {
			// In case there is only one plugin, we can use its kind directly.
			// Otherwise, we marked it as a plugin module. That means the plugin module contains a list of plugins.
			kind = string(plugin.Spec.Plugins[0].Kind)
		}
		status := plugin.Status
		if status == nil {
			// If the status is nil, we set it to an empty status.
			status = &pluginModel.ModuleStatus{}
		}
		matrix = append(matrix, []string{
			plugin.Metadata.Name,
			plugin.Metadata.Version,
			kind,
			fmt.Sprintf("%t", status.IsLoaded),
			fmt.Sprintf("%t", status.InDev),
		})
	}
	output.HandlerTable(o.writer, columnHeader, matrix)
	return nil
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
		Use:   "list",
		Short: "List all the plugins installed in the remote server",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddOutputFlags(cmd, &o.OutputOption)
	return cmd
}
