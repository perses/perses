// Copyright 2022 The Perses Authors
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

package migrate

import (
	"encoding/json"
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.OutputOption
	writer    io.Writer
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'migrate'")
	}
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	var grafanaDashboard json.RawMessage
	if err := file.Unmarshal(o.File, &grafanaDashboard); err != nil {
		return err
	}
	persesDashboard, err := o.apiClient.Migrate(&grafanaDashboard)
	if err != nil {
		return err
	}
	return output.Handle(o.writer, o.Output, persesDashboard)
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "migrate -f [GRAFANA_DASHBOARD_JSON_FILE]",
		Short: "migrate a Grafana dashboard to the Perses format",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.MarkFileFlagAsMandatory(cmd)
	return cmd
}
