// Copyright The Perses Authors
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
	writer         io.Writer
	errWriter      io.Writer
	pluginPath     string
	schemaPath     string
	dashboardSch   *dashboardSchema
	customRulePath string
	customRules    []*apiConfig.CustomLintRule
	online         bool
	sch            schema.Schema
	apiClient      api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'lint'")
	}
	if len(o.pluginPath) > 0 {
		pl := plugin.New(apiConfig.Plugin{
			ArchivePaths: []string{o.pluginPath},
			Path:         o.pluginPath,
		})
		if err := pl.UnzipArchives(); err != nil {
			return err
		}
		if err := pl.Load(); err != nil {
			return err
		}
		o.sch = pl.Schema()
	}
	if len(o.schemaPath) > 0 {
		sch, err := loadDashboardSchema(o.schemaPath)
		if err != nil {
			return err
		}
		o.dashboardSch = sch
	}
	if len(o.customRulePath) > 0 {
		if err := file.Unmarshal(o.customRulePath, &o.customRules); err != nil {
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
		// Get the config from the server to get the custom-rules
		cfg, err := o.apiClient.Config()
		if err != nil {
			return err
		}
		o.customRules = cfg.Dashboard.CustomLintRules
	}
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	var files []string
	if len(o.File) > 0 {
		files = []string{o.File}
	} else if len(o.Directory) > 0 {
		var err error
		files, err = file.List(o.Directory)
		if err != nil {
			return err
		}
	}
	var entities []modelAPI.Entity
	for _, f := range files {
		// The file is read only once, as it can be the standard input.
		data, isJSON, err := file.Read(f)
		if err != nil {
			return err
		}
		fileEntities, err := file.UnmarshalEntitiesFromData(f, data, isJSON)
		if err != nil {
			return err
		}
		// The dashboards are validated against the complete schema with the content of the file,
		// as the entities lose the unknown fields and get the default values.
		// It is done before the other checks, as the checks of DashboardSpec expect valid variables.
		if o.dashboardSch != nil {
			if err := o.dashboardSch.validate(f, data, isJSON); err != nil {
				return err
			}
		}
		entities = append(entities, fileEntities...)
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
	if o.sch == nil && !o.online && o.dashboardSch == nil {
		return nil
	}
	// When linting offline, the configuration of the server is unknown.
	// So the server-dependent checks (like the maximum timeout of the datasource proxy) are skipped by passing a nil proxy config.
	// They are done by the server when using the online mode.
	for _, object := range objects {
		switch entity := object.(type) {
		case *modelV1.Dashboard:
			if err := validate.DashboardWithCustomRules(entity, o.customRules); err != nil {
				return err
			}
			if o.online {
				if err := o.apiClient.Validate().Dashboard(entity); err != nil {
					return err
				}
			} else {
				if err := validate.DashboardSpec(entity.Spec, o.sch, nil); err != nil {
					return fmt.Errorf("unexpected error in dashboard %q: %w", entity.Metadata.Name, err)
				}
			}
		case *modelV1.GlobalDatasource:
			if o.online {
				if err := o.apiClient.Validate().GlobalDatasource(entity); err != nil {
					return err
				}
			} else if err := validate.Datasource(entity, nil, o.sch, nil); err != nil {
				return err
			}
		case *modelV1.Datasource:
			if o.online {
				if err := o.apiClient.Validate().Datasource(entity); err != nil {
					return err
				}
			} else if err := validate.Datasource(entity, nil, o.sch, nil); err != nil {
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

# Validate the dashboards offline against the complete dashboard schema of a Perses server.
# It also rejects the unknown or misspelled fields.
percli schema get dashboards --output-file dashboard-schema.cue
percli lint -d ./dashboards --schema dashboard-schema.cue
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	opt.MarkFileAndDirFlagsAsXOR(cmd)
	cmd.Flags().StringVar(&o.customRulePath, "custom-rule.path", "", "Path to the custom rules.")
	cmd.Flags().StringVar(&o.pluginPath, "plugin.path", "", "Path to the Perses plugins.")
	cmd.Flags().BoolVar(&o.online, "online", false, "When enable, it can request the API to make additional validation")
	cmd.Flags().StringVar(&o.schemaPath, "schema", "", "Path to the complete dashboard CUE schema, as downloaded with 'percli schema get dashboards'. The dashboards are validated against its definition #Dashboard, without any remote server. The schema doesn't describe the other resources (datasources, variables): their plugins are not validated, only basic checks are done, like the name of a variable.")
	// When "online" flag is used, the CLI will call the endpoint /validate that will then use the schema from the server.
	// So no need to use / load the plugins with the CLI.
	cmd.MarkFlagsMutuallyExclusive("plugin.path", "online")
	// The dashboard schema already contains the plugin schemas, and it is meant to be used without a remote server.
	cmd.MarkFlagsMutuallyExclusive("schema", "online")
	cmd.MarkFlagsMutuallyExclusive("schema", "plugin.path")
	// When "online" flag is used, the CLI  will use the custom-rule from the server.
	cmd.MarkFlagsMutuallyExclusive("custom-rule.path", "online")
	return cmd
}
