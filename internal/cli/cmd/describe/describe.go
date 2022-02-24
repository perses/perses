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

package describe

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
	project         string
	name            string
	output          string
	resourceService cmdUtilsService.Service
}

func (o *option) Complete(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf(cmdUtils.FormatAvailableResourcesMessage())
	} else if len(args) < 2 {
		return fmt.Errorf("you have to specify the name of the resource you have to describe")
	} else if len(args) > 2 {
		return fmt.Errorf("you cannot have more than two arguments for the command 'describe'")
	}
	o.name = args[1]

	var err error
	o.kind, err = cmdUtils.GetKind(args[0])
	if err != nil {
		return err
	}

	// Then, if no particular project has been specified through a flag, let's grab the one defined in the CLI config.
	if len(o.project) == 0 {
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
	return cmdUtils.ValidateAndSetOutput(&o.output)
}

func (o *option) Execute() error {
	entity, err := o.resourceService.GetResource(o.name)
	if err != nil {
		return err
	}
	return cmdUtils.HandleOutput(o.writer, o.output, entity)
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "describe [SUBTYPE] [NAME]",
		Short: "Show details of a specific resource",
		Example: `
## Describe a particular dashboards.
percli describe dashboard nodeExporter

## Describe a particular dashboards in a json.
percli describe dashboard nodeExporter -ojson
`,
		Run: func(cmd *cobra.Command, args []string) {
			cmdUtils.RunCMD(o, cmd, args)
		},
	}
	cmd.Flags().StringVarP(&o.project, "project", "p", o.project, "If present, the project scope for this CLI request.")
	cmd.Flags().StringVarP(&o.output, "output", "o", o.output, "One of 'yaml' or 'json'. Default is 'yaml'.")
	return cmd
}
