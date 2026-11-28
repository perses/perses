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
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

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

// sourcedEntity is an entity together with the file it has been read from.
type sourcedEntity struct {
	entity modelAPI.Entity
	file   string
}

// lintError describes why a resource (or a file, when it cannot be decoded) is invalid.
type lintError struct {
	kind    string
	project string
	name    string
	file    string
	err     error
}

func (e *lintError) Error() string {
	var sb strings.Builder
	if len(e.kind) > 0 {
		sb.WriteString(e.kind)
		sb.WriteString(" ")
		if len(e.project) > 0 {
			_, _ = fmt.Fprintf(&sb, "%q", e.project+"/"+e.name)
		} else {
			_, _ = fmt.Fprintf(&sb, "%q", e.name)
		}
		if len(e.file) > 0 {
			_, _ = fmt.Fprintf(&sb, " (file %q)", e.file)
		}
		sb.WriteString(": ")
	} else if len(e.file) > 0 && !strings.Contains(e.err.Error(), strconv.Quote(e.file)) {
		// Some decoding errors don't mention the file, which is needed to tell the failures apart.
		_, _ = fmt.Fprintf(&sb, "file %q: ", e.file)
	}
	sb.WriteString(e.err.Error())
	return sb.String()
}

func newEntityLintError(se sourcedEntity, err error) *lintError {
	lintErr := &lintError{
		kind: se.entity.GetKind(),
		file: se.file,
		err:  err,
	}
	switch m := se.entity.GetMetadata().(type) {
	case *modelV1.ProjectMetadata:
		lintErr.name = m.Name
		lintErr.project = m.Project
	default:
		lintErr.name = m.GetName()
	}
	return lintErr
}

func buildError(lintErrors []*lintError) error {
	var sb strings.Builder
	_, _ = fmt.Fprintf(&sb, "%d invalid resource(s) found:", len(lintErrors))
	for _, lintErr := range lintErrors {
		sb.WriteString("\n- ")
		sb.WriteString(lintErr.Error())
	}
	return fmt.Errorf("%s", sb.String())
}

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
	var entities []sourcedEntity
	var lintErrors []*lintError
	for _, f := range files {
		fileEntities, fileErrors, err := o.readFile(f)
		if err != nil {
			// A single file that cannot be read is reported as is. In a directory, the other files are still checked.
			if len(o.File) > 0 {
				return err
			}
			lintErrors = append(lintErrors, &lintError{file: f, err: err})
			continue
		}
		entities = append(entities, fileEntities...)
		lintErrors = append(lintErrors, fileErrors...)
	}
	lintErrors = append(lintErrors, o.validate(entities)...)
	if len(lintErrors) > 0 {
		return buildError(lintErrors)
	}
	return output.HandleString(o.writer, "your resources look good")
}

// readFile decodes the resources of the file, and validates its dashboards against the complete dashboard schema if any.
// It returns the resources to check, the errors found in the file, and an error when the whole file cannot be read or decoded.
func (o *option) readFile(f string) ([]sourcedEntity, []*lintError, error) {
	// The file is read only once, as it can be the standard input.
	data, isJSON, err := file.Read(f)
	if err != nil {
		return nil, nil, err
	}
	resources, err := file.UnmarshalResourcesFromData(f, data, isJSON)
	if err != nil {
		return nil, nil, err
	}
	// The dashboards are validated against the complete schema with the content of the file,
	// as the entities lose the unknown fields and get the default values.
	invalidDashboards := map[int]invalidDashboard{}
	if o.dashboardSch != nil {
		dashboards, schemaErr := o.dashboardSch.validate(f, data, isJSON)
		if schemaErr != nil {
			return nil, nil, schemaErr
		}
		for _, dash := range dashboards {
			invalidDashboards[dash.index] = dash
		}
	}
	var entities []sourcedEntity
	var lintErrors []*lintError
	for _, resource := range resources {
		if dash, ok := invalidDashboards[resource.Index]; ok {
			// A dashboard not matching the schema skips the other checks, as the checks of DashboardSpec expect valid variables.
			// It is reported once, with the decoding error if any.
			lintErrors = append(lintErrors, &lintError{
				kind:    string(modelV1.KindDashboard),
				project: dash.project,
				name:    dash.name,
				file:    f,
				err:     errors.Join(dash.err, resource.Err),
			})
			continue
		}
		if resource.Err != nil {
			lintErrors = append(lintErrors, &lintError{file: f, err: resource.Err})
			continue
		}
		entities = append(entities, sourcedEntity{entity: resource.Entity, file: f})
	}
	return entities, lintErrors, nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

// validate checks every entity and returns all the errors found, instead of stopping at the first one.
func (o *option) validate(objects []sourcedEntity) []*lintError {
	if o.sch == nil && !o.online && o.dashboardSch == nil {
		return nil
	}
	var lintErrors []*lintError
	for _, object := range objects {
		if err := o.validateEntity(object.entity); err != nil {
			lintErrors = append(lintErrors, newEntityLintError(object, err))
		}
	}
	return lintErrors
}

func (o *option) validateEntity(object modelAPI.Entity) error {
	// When linting offline, the configuration of the server is unknown.
	// So the server-dependent checks (like the maximum timeout of the datasource proxy) are skipped by passing a nil proxy config.
	// They are done by the server when using the online mode.
	switch entity := object.(type) {
	case *modelV1.Dashboard:
		if err := validate.DashboardWithCustomRules(entity, o.customRules); err != nil {
			return err
		}
		if o.online {
			return o.apiClient.Validate().Dashboard(entity)
		}
		return validate.DashboardSpec(entity.Spec, o.sch, nil)
	case *modelV1.GlobalDatasource:
		if o.online {
			return o.apiClient.Validate().GlobalDatasource(entity)
		}
		return validate.Datasource(entity, nil, o.sch, nil)
	case *modelV1.Datasource:
		if o.online {
			return o.apiClient.Validate().Datasource(entity)
		}
		return validate.Datasource(entity, nil, o.sch, nil)
	case *modelV1.GlobalVariable:
		if o.online {
			return o.apiClient.Validate().GlobalVariable(entity)
		}
		return validate.Variable(entity, o.sch)
	case *modelV1.Variable:
		if o.online {
			return o.apiClient.Validate().Variable(entity)
		}
		return validate.Variable(entity, o.sch)
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
