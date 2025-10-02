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

	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

const persesAPIVersion = "perses.dev/v1alpha1"

var inputRegexp = regexp.MustCompile("([a-zA-Z0-9_-]+)=(.+)")

type kubeMetadata struct {
	Namespace string `json:"namespace" yaml:"namespace"`
	Name      string `json:"name" yaml:"name"`
}

type kubeCustomResource struct {
	APIVersion string                `json:"apiVersion" yaml:"apiVersion"`
	Kind       string                `json:"kind" yaml:"kind"`
	Metadata   kubeMetadata          `json:"metadata" yaml:"metadata"`
	Spec       modelV1.DashboardSpec `json:"spec" yaml:"spec"`
}

func createCustomResource(dash *modelV1.Dashboard) *kubeCustomResource {
	return &kubeCustomResource{
		APIVersion: persesAPIVersion,
		Kind:       "PersesDashboard",
		Metadata: kubeMetadata{
			Namespace: dash.Metadata.Project,
			Name:      dash.Metadata.Name,
		},
		Spec: dash.Spec,
	}
}

type migrationFormat string

const (
	nativeFormat              migrationFormat = "native"
	customResourceFormat      migrationFormat = "custom-resource"
	customResourceShortFormat migrationFormat = "cr"
)

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.OutputOption
	writer               io.Writer
	errWriter            io.Writer
	rowInput             []string
	input                map[string]string
	project              string
	pluginPath           string
	online               bool
	useDefaultDatasource bool
	mig                  migrate.Migration
	apiClient            api.ClientInterface
	migrationFormat      migrationFormat
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'migrate'")
	}
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	o.completeInput()
	if len(o.pluginPath) > 0 {
		pl := plugin.New(apiConfig.Plugin{
			Path: o.pluginPath,
		})
		if err := pl.Load(); err != nil {
			return err
		}
		o.mig = pl.Migration()
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
	if o.migrationFormat != nativeFormat && o.migrationFormat != customResourceFormat && o.migrationFormat != customResourceShortFormat {
		return fmt.Errorf("invalid value for flag --format: %s", o.migrationFormat)
	}

	if !o.online && o.mig == nil {
		return fmt.Errorf("offline migration requires --plugin.path to be specified, or use --online for server-side migration")
	}
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
	persesDashboard.Metadata.Project = o.project

	if o.migrationFormat == customResourceFormat || o.migrationFormat == customResourceShortFormat {
		customResource := createCustomResource(persesDashboard)
		return output.Handle(o.writer, o.Output, customResource)
	}
	return output.Handle(o.writer, o.Output, persesDashboard)
}

func (o *option) onlineExecution(grafanaDashboard json.RawMessage) (*modelV1.Dashboard, error) {
	return o.apiClient.Migrate(&modelAPI.Migrate{
		Input:                o.input,
		GrafanaDashboard:     grafanaDashboard,
		UseDefaultDatasource: o.useDefaultDatasource,
	})
}

func (o *option) offlineExecution(grafanaDashboard json.RawMessage) (*modelV1.Dashboard, error) {
	rawGrafanaDashboard := []byte(migrate.ReplaceInputValue(o.input, string(grafanaDashboard)))
	dash := &migrate.SimplifiedDashboard{}
	if err := json.Unmarshal(rawGrafanaDashboard, dash); err != nil {
		return nil, err
	}
	return o.mig.Migrate(dash, o.useDefaultDatasource)
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
	cmd.Flags().StringVar((*string)(&o.migrationFormat), "format", string(nativeFormat), "The format of the migration. Can be 'native' or 'custom-resource' or shorter 'cr'.")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the Perses plugins.")
	cmd.Flags().BoolVar(&o.online, "online", false, "When enabled, it can request the API to use it to perform the migration")
	cmd.Flags().BoolVar(&o.useDefaultDatasource, "use-default-datasource", false, "When enabled, the default Perses datasource will be used for all panels. This will remove any reference to a specific datasource in the migrated dashboard.")
	cmd.Flags().StringVar(&o.project, "project", "", "The project to use for the migration. If not set, then the field 'project' in the dashboard will not be set. When the format 'cr' is used, the project will be set to the namespace of the custom resource.")
	// When "online" flag is used, the CLI will call the endpoint /migrate that will then use the schema from the server.
	// So no need to use / load the schemas with the CLI.
	cmd.MarkFlagsMutuallyExclusive("plugin.path", "online")
	return cmd
}
