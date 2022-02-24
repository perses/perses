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

	cmdUtils "github.com/perses/perses/internal/cli/utils"
	cmdUtilsService "github.com/perses/perses/internal/cli/utils/service"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

type option struct {
	cmdUtils.CMDOption
	writer          io.Writer
	kind            modelV1.Kind
	allProject      bool
	project         string
	output          string
	prefix          string
	resourceService cmdUtilsService.Service
}

func (o *option) Complete(args []string) error {
	// first let's analyze the args to get what kind of resource we should get and if there is a prefix to use for the filtering.
	if len(args) <= 0 {
		return fmt.Errorf(cmdUtils.FormatAvailableResourcesMessage())
	} else if len(args) == 2 {
		// In second position in the arguments, you can have a prefix that will be used to filter the resources.
		o.prefix = args[1]
	} else if len(args) > 2 {
		return fmt.Errorf("you cannot have more than two arguments for the command 'get'")
	}

	var err error
	o.kind, err = cmdUtils.GetKind(args[0])
	if err != nil {
		return err
	}

	// Then, if no particular project has been specified through a flag, let's grab the one defined in the CLI config.
	if len(o.project) == 0 && !o.allProject {
		o.project = cmdUtils.GlobalConfig.Project
	}

	// Finally, get the api client we will need later.
	apiClient, err := cmdUtils.GlobalConfig.GetAPIClient()
	if err != nil {
		return err
	}

	svc, svcErr := cmdUtilsService.NewService(o.kind, o.project, apiClient)
	if svcErr != nil {
		return err
	}
	o.resourceService = svc
	return nil
}

func (o *option) Validate() error {
	// check if project should be defined (through the config or through the flag) for the given resource.
	if !o.allProject && len(o.project) == 0 && !cmdUtils.IsGlobalResource(o.kind) {
		return fmt.Errorf("no project has been defined for the scope of this command. If you intended to get all resources across the different project, please use the flag --all")
	}
	if len(o.output) > 0 {
		// In this particular command, the default display is a matrix.
		return cmdUtils.ValidateAndSetOutput(&o.output)
	}
	return nil
}

func (o *option) Execute() error {
	resourceList, err := o.resourceService.ListResource(o.prefix)
	if err != nil {
		return err
	}
	if len(o.output) > 0 {
		return cmdUtils.HandleOutput(o.writer, o.output, resourceList)
	}
	entities, err := cmdUtils.ConvertToEntity(resourceList)
	if err != nil {
		return err
	}
	data := o.resourceService.BuildMatrix(entities)
	cmdUtils.HandlerTable(o.writer, o.resourceService.GetColumHeader(), data)
	return nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "get [SUBTYPE] [PREFIX]",
		Short: "Retrieve any kind of resource from the API.",
		Example: `
# List all dashboards in the current project selected.
percli get dashboards 

# List all dashboards that begin with a given name in the current project selected.
percli get dashboards node

# List all dashboards in a specific project.
percli get dashboards -p my_project

#List all dashboards as a json object.
percli get dashboards -a -ojson

`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return cmdUtils.RunCMD(o, cmd, args)
		},
	}
	cmd.Flags().BoolVarP(&o.allProject, "all", "a", o.allProject, "If present, list the request object(s) across all projects. Project in current context is ignored even if specified with --project.")
	cmd.Flags().StringVarP(&o.project, "project", "p", o.project, "If present, the project scope for this CLI request.")
	cmd.Flags().StringVarP(&o.output, "output", "o", o.output, "Kind of display: 'yaml' or 'json'.")
	return cmd
}
