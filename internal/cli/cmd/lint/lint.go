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

package lint

import (
	"fmt"
	"io"

	apiConfig "github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/internal/api/shared/validate"
	"github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.ProjectOption
	writer             io.Writer
	chartsSchemas      string
	queriesSchemas     string
	datasourcesSchemas string
	online             bool
	sch                schemas.Schemas
	apiClient          api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'lint'")
	}
	if (len(o.chartsSchemas) > 0 && len(o.queriesSchemas) > 0) || len(o.datasourcesSchemas) > 0 {
		o.sch = schemas.New(apiConfig.Schemas{
			PanelsPath:      o.chartsSchemas,
			QueriesPath:     o.queriesSchemas,
			DatasourcesPath: o.datasourcesSchemas,
		})
	}
	if o.online {
		// complete the project value. We don't catch the issue here in case it's empty because for many cases we don't need it.
		// We will check at the runtime when it is necessary / makes sense
		_ = o.ProjectOption.Complete()
		// Finally, get the api client we will need later.
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
	objects, err := file.UnmarshalEntity(o.File)
	if err != nil {
		return err
	}
	if validateErr := o.validate(objects); validateErr != nil {
		return validateErr
	}
	return output.HandleString(o.writer, "your resources look good")
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) validate(objects []modelAPI.Entity) error {
	var gdtsList []*modelV1.GlobalDatasource
	var dtsList []*modelV1.Datasource
	if o.sch == nil {
		return nil
	}
	for _, object := range objects {
		switch entity := object.(type) {
		case *modelV1.Dashboard:
			if err := validate.Dashboard(entity, o.sch); err != nil {
				return fmt.Errorf("unexpected error in dashboard %q: %w", entity.Metadata.Name, err)
			}
		case *modelV1.GlobalDatasource:
			if o.online && len(gdtsList) == 0 {
				var err error
				gdtsList, err = o.apiClient.V1().GlobalDatasource().List("")
				if err != nil {
					return err
				}
			}
			if err := validate.Datasource(entity, gdtsList, o.sch); err != nil {
				return err
			}
		case *modelV1.Datasource:
			if o.online && len(dtsList) == 0 {
				var err error
				if len(o.Project) == 0 {
					return fmt.Errorf("project is not defined. Please set it using the flag --project or using the command perses project <project_name>")
				}
				dtsList, err = o.apiClient.V1().Datasource(o.Project).List("")
				if err != nil {
					return err
				}
			}
			if err := validate.Datasource(entity, dtsList, o.sch); err != nil {
				return err
			}
		}
	}
	return nil
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "lint -f [FILENAME]",
		Short: "Static check of the resources",
		Long: `
The lint command will check statically that your resources are valid. 
It doesn't necessary mean you won't face any issue when applying them.

JSON and YAML formats are accepted.
`,
		Example: `
# Check resources from a JSON file
percli lint -f ./resources.json

# Check resources from stdin.
cat resources.json | percli lint -f -

# Use a remote server to make additional validation (useful only for the datasources for the moment)
percli lint -f ./resources.json --online
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddProjectFlags(cmd, &o.ProjectOption)
	opt.MarkFileFlagAsMandatory(cmd)
	cmd.Flags().StringVar(&o.chartsSchemas, "schemas.charts", "", "Path to the CUE schemas for charts.")
	cmd.Flags().StringVar(&o.queriesSchemas, "schemas.queries", "", "Path to the CUE schemas for queries.")
	cmd.Flags().StringVar(&o.datasourcesSchemas, "schemas.datasources", "", "Path to the CUE schemas for the datasources")
	cmd.Flags().BoolVar(&o.online, "online", false, "When enable, it can request the API to make additional validation")
	cmd.MarkFlagsRequiredTogether("schemas.charts", "schemas.queries")
	return cmd
}
