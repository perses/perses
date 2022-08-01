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

	"github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/internal/cli/service"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	writer          io.Writer
	kind            modelV1.Kind
	project         string
	name            string
	output          string
	resourceService service.Service
}

func (o *option) Complete(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf(resource.FormatMessage())
	}

	var err error
	o.kind, err = resource.GetKind(args[0])
	if err != nil {
		return err
	}

	if len(args) < 2 {
		return fmt.Errorf("please specify the name of the resource you want to describe")
	} else if len(args) > 2 {
		return fmt.Errorf("you cannot have more than two arguments for the command 'describe'")
	}
	o.name = args[1]

	// Then, if no particular project has been specified through a flag, let's grab the one defined in the CLI config.
	if len(o.project) == 0 {
		o.project = config.Global.Project
	}

	// Finally, get the api client we will need later.
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}

	svc, svcErr := service.New(o.kind, o.project, apiClient)
	if svcErr != nil {
		return err
	}
	o.resourceService = svc
	return nil
}

func (o *option) Validate() error {
	// check if project should be defined (through the config or through the flag) for the given resource.
	if len(o.project) == 0 && !resource.IsGlobal(o.kind) {
		return fmt.Errorf("no project has been defined for the scope of this command")
	}
	return output.ValidateAndSet(&o.output)
}

func (o *option) Execute() error {
	entity, err := o.resourceService.GetResource(o.name)
	if err != nil {
		return err
	}
	return output.Handle(o.writer, o.output, entity)
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "describe [RESOURCE_TYPE] [NAME]",
		Short: "Show details of a specific resource",
		Example: `
## Describe a particular dashboard.
percli describe dashboard nodeExporter

## Describe a particular dashboard as a JSON object.
percli describe dashboard nodeExporter -ojson
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVarP(&o.project, "project", "p", o.project, "If present, the project scope for this CLI request.")
	cmd.Flags().StringVarP(&o.output, "output", "o", o.output, "One of 'yaml' or 'json'. Default is 'yaml'.")
	return cmd
}
