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

package lint

import (
	"fmt"
	"io"

	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/validate"
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

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.DirectoryOption
	writer     io.Writer
	errWriter  io.Writer
	pluginPath string
	online     bool
	sch        schema.Schema
	apiClient  api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'lint'")
	}
	if len(o.pluginPath) > 0 {
		pl := plugin.New(apiConfig.Plugins{
			Path: o.pluginPath,
		})
		if err := pl.Load(); err != nil {
			return err
		}
		o.sch = pl.Schema()
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

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	var entities []modelAPI.Entity
	if len(o.File) > 0 {
		var err error
		entities, err = file.UnmarshalEntitiesFromFile(o.File)
		if err != nil {
			return err
		}
	} else if len(o.Directory) > 0 {
		var errorList []error
		entities, errorList = file.UnmarshalEntitiesFromDirectory(o.Directory)
		if len(errorList) > 0 {
			return errorList[0]
		}
	}
	if validateErr := o.validate(entities); validateErr != nil {
		return validateErr
	}
	return output.HandleString(o.writer, "your resources look good")
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func (o *option) validate(objects []modelAPI.Entity) error {
	if o.sch == nil && !o.online {
		return nil
	}
	for _, object := range objects {
		switch entity := object.(type) {
		case *modelV1.Dashboard:
			if o.online {
				if err := o.apiClient.Validate().Dashboard(entity); err != nil {
					return err
				}
			} else if err := validate.DashboardSpec(entity.Spec, o.sch); err != nil {
				return fmt.Errorf("unexpected error in dashboard %q: %w", entity.Metadata.Name, err)
			}

		case *modelV1.GlobalDatasource:
			if o.online {
				if err := o.apiClient.Validate().GlobalDatasource(entity); err != nil {
					return err
				}
			} else if err := validate.Datasource(entity, nil, o.sch); err != nil {
				return err
			}
		case *modelV1.Datasource:
			if o.online {
				if err := o.apiClient.Validate().Datasource(entity); err != nil {
					return err
				}
			} else if err := validate.Datasource(entity, nil, o.sch); err != nil {
				return err
			}
		case *modelV1.GlobalVariable:
			if o.online {
				if err := o.apiClient.Validate().GlobalVariable(entity); err != nil {
					return err
				}
			} else if err := validate.Variable(entity, o.sch); err != nil {
				return err
			}
		case *modelV1.Variable:
			if o.online {
				if err := o.apiClient.Validate().Variable(entity); err != nil {
					return err
				}
			} else if err := validate.Variable(entity, o.sch); err != nil {
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

# Use a remote server to make additional validation (useful only for the datasources and the dashboards)
percli lint -f ./resources.json --online
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	opt.MarkFileAndDirFlagsAsXOR(cmd)
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the Perses plugins.")
	cmd.Flags().BoolVar(&o.online, "online", false, "When enable, it can request the API to make additional validation")
	// When "online" flag is used, the CLI will call the endpoint /validate that will then use the schema from the server.
	// So no need to use / load the plugins with the CLI.
	cmd.MarkFlagsMutuallyExclusive("plugin.path", "online")
	return cmd
}
