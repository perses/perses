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
	"regexp"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/spf13/cobra"
)

var inputRegexp = regexp.MustCompile("([a-zA-Z0-9_-]+)=(.+)")

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.OutputOption
	writer    io.Writer
	rowInput  []string
	input     map[string]string
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'migrate'")
	}
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	o.completeInput()
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient
	return nil
}

func (o *option) completeInput() {
	if len(o.rowInput) <= 0 {
		return
	}
	o.input = make(map[string]string)
	for _, label := range o.rowInput {
		groups := inputRegexp.FindAllStringSubmatch(label, -1)
		for _, group := range groups {
			k := group[1]
			v := ""
			if len(group) == 3 {
				v = group[2]
			}
			o.input[k] = v
		}
	}
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	var grafanaDashboard json.RawMessage
	if err := file.Unmarshal(o.File, &grafanaDashboard); err != nil {
		return err
	}
	persesDashboard, err := o.apiClient.Migrate(&modelAPI.Migrate{
		Input:            o.input,
		GrafanaDashboard: grafanaDashboard,
	})
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
		Example: `
# Migrate a Grafana dashboard with input
percli migrate -f ./dashboard.json --input=DS_PROMETHEUS=PrometheusDemo
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddOutputFlags(cmd, &o.OutputOption)
	opt.MarkFileFlagAsMandatory(cmd)
	cmd.Flags().StringArrayVar(&o.rowInput, "input", o.rowInput, "Grafana input values. Syntax supported is InputName=InputValue")
	return cmd
}
