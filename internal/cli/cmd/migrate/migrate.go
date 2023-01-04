// Copyright 2023 The Perses Authors
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

	apiConfig "github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/migrate"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

var inputRegexp = regexp.MustCompile("([a-zA-Z0-9_-]+)=(.+)")

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.OutputOption
	writer           io.Writer
	rowInput         []string
	input            map[string]string
	chartsSchemas    string
	queriesSchemas   string
	variablesSchemas string
	online           bool
	mig              migrate.Migration
	apiClient        api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'migrate'")
	}
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	o.completeInput()
	if (len(o.chartsSchemas) > 0 && len(o.queriesSchemas) > 0) || len(o.variablesSchemas) > 0 {
		var err error
		o.mig, err = migrate.New(apiConfig.Schemas{
			PanelsPath:    o.chartsSchemas,
			QueriesPath:   o.queriesSchemas,
			VariablesPath: o.variablesSchemas,
		})
		if err != nil {
			return err
		}
	}
	if o.online {
		// Finally, get the api client we will need later.
		apiClient, err := config.Global.GetAPIClient()
		if err != nil {
			return err
		}
		o.apiClient = apiClient
	}
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
	var persesDashboard *modelV1.Dashboard
	var err error
	if o.online {
		persesDashboard, err = o.onlineExecution(grafanaDashboard)
	} else {
		persesDashboard, err = o.offlineExecution(grafanaDashboard)
	}
	if err != nil {
		return err
	}
	return output.Handle(o.writer, o.Output, persesDashboard)
}

func (o *option) onlineExecution(grafanaDashboard json.RawMessage) (*modelV1.Dashboard, error) {
	return o.apiClient.Migrate(&modelAPI.Migrate{
		Input:            o.input,
		GrafanaDashboard: grafanaDashboard,
	})
}

func (o *option) offlineExecution(grafanaDashboard json.RawMessage) (*modelV1.Dashboard, error) {
	finalGrafanaDashboard := migrate.ReplaceInputValue(o.input, string(grafanaDashboard))
	return o.mig.Migrate([]byte(finalGrafanaDashboard))
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
percli migrate -f ./dashboard.json --input=DS_PROMETHEUS=PrometheusDemo --online
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddOutputFlags(cmd, &o.OutputOption)
	opt.MarkFileFlagAsMandatory(cmd)
	cmd.Flags().StringArrayVar(&o.rowInput, "input", o.rowInput, "Grafana input values. Syntax supported is InputName=InputValue")
	cmd.Flags().StringVar(&o.chartsSchemas, "schemas.charts", "", "Path to the CUE schemas for dasbhoard charts.")
	cmd.Flags().StringVar(&o.queriesSchemas, "schemas.queries", "", "Path to the CUE schemas for chart queries.")
	cmd.Flags().StringVar(&o.variablesSchemas, "schemas.variables", "", "Path to the CUE schemas for the dashboard variables")
	cmd.Flags().BoolVar(&o.online, "online", false, "When enable, it can request the API to use it to perform the migration")

	// when online flag is used, the CLI will call the endpoint /migrate that will then use the schema from the server.
	// So no need to use / load the schemas with the CLI.
	cmd.MarkFlagsMutuallyExclusive("schemas.charts", "online")
	cmd.MarkFlagsMutuallyExclusive("schemas.queries", "online")
	cmd.MarkFlagsMutuallyExclusive("schemas.variables", "online")
	return cmd
}
