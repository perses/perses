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

package get

import (
	"fmt"
	"io"

	"github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/internal/cli/service"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	opt.ProjectOption
	opt.OutputOption
	writer          io.Writer
	kind            modelV1.Kind
	allProject      bool
	prefix          string
	resourceService service.Service
}

func (o *option) Complete(args []string) error {
	// first let's analyze the args to get what kind of resource we should get and if there is a prefix to use for the filtering.
	if len(args) == 0 {
		return fmt.Errorf(resource.FormatMessage())
	} else if len(args) == 2 {
		// In second position in the arguments, you can have a prefix that will be used to filter the resources.
		o.prefix = args[1]
	} else if len(args) > 2 {
		return fmt.Errorf("you cannot have more than two arguments for the command 'get'")
	}

	var err error
	o.kind, err = resource.GetKind(args[0])
	if err != nil {
		return err
	}

	// Complete the output only if it has been set by the user
	if len(o.Output) > 0 {
		if outputErr := o.OutputOption.Complete(); outputErr != nil {
			return err
		}
	}
	// Complete the Project field if only the flag all is not set
	if !o.allProject && !resource.IsGlobal(o.kind) {
		// Complete the project only if the user want to get project resources
		if projectErr := o.ProjectOption.Complete(); projectErr != nil {
			return projectErr
		}
	}

	// Finally, get the api client we will need later.
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}

	svc, svcErr := service.New(o.kind, o.Project, apiClient)
	if svcErr != nil {
		return svcErr
	}
	o.resourceService = svc
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	resourceList, err := o.resourceService.ListResource(o.prefix)
	if err != nil {
		return err
	}
	if len(o.Output) > 0 {
		return output.Handle(o.writer, o.Output, resourceList)
	}
	data := o.resourceService.BuildMatrix(resourceList)
	output.HandlerTable(o.writer, o.resourceService.GetColumHeader(), data)
	return nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "get [RESOURCE_TYPE] [PREFIX]",
		Short: "Retrieve any kind of resource from the API.",
		Example: `
# List all dashboards in the current project selected.
percli get dashboards 

# List all dashboards that begin with a given name in the current project selected.
percli get dashboards node

# List all dashboards in a specific project.
percli get dashboards -p my_project

#List all dashboards as a JSON object.
percli get dashboards -a -ojson

`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddOutputFlags(cmd, &o.OutputOption)
	opt.AddProjectFlags(cmd, &o.ProjectOption)
	cmd.Flags().BoolVarP(&o.allProject, "all", "a", o.allProject, "If present, list the requested object(s) across all projects. The project in the current context is ignored even if specified with --project.")
	cmd.MarkFlagsMutuallyExclusive("project", "all")
	return cmd
}
