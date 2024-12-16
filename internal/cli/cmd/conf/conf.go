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

package conf

import (
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	opt.OutputOption
	writer    io.Writer
	errWriter io.Writer
	online    bool
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'config'")
	}
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	if o.online {
		apiClient, err := config.Global.GetAPIClient()
		if err != nil {
			return err
		}
		o.apiClient = apiClient
	}
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	if !o.online {
		return output.Handle(o.writer, o.Output, config.NewPublicConfig(config.Global))
	}
	cfg, err := o.apiClient.Config()
	if err != nil {
		return err
	}
	return output.Handle(o.writer, o.Output, cfg)
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
		Use:   "config",
		Short: "display local or remote config",
		Example: `
# Display local config in json
percli config --output=json

# Display remote config in yaml
percli config --online --output=yaml
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddOutputFlags(cmd, &o.OutputOption)
	cmd.Flags().BoolVar(&o.online, "online", o.online, "When enable, it can request the API to display the remote config")
	return cmd
}
