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

package apply

import (
	"errors"
	"fmt"
	"io"

	"github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/internal/cli/service"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	writer    io.Writer
	file      string
	project   string
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'apply'")
	}

	// Then, if no particular project has been specified through a flag, let's grab the one defined in the CLI config.
	if len(o.project) == 0 {
		o.project = config.Global.Project
	}

	// Finally, get the api client we will need later.
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient
	return nil
}

func (o *option) Validate() error {
	if len(o.file) == 0 {
		return fmt.Errorf("file must be provided")
	}
	return nil
}

func (o *option) Execute() error {
	entities, err := file.UnmarshalEntity(o.file)
	if err != nil {
		return err
	}
	for _, entity := range entities {
		kind := modelV1.Kind(entity.GetKind())
		name := entity.GetMetadata().GetName()
		project := resource.GetProject(entity.GetMetadata(), o.project)
		svc, svcErr := service.New(kind, project, o.apiClient)
		if svcErr != nil {
			return svcErr
		}

		// retrieve if exists the entity from the Perses API
		_, apiError := svc.GetResource(name)
		if apiError != nil && !errors.Is(apiError, perseshttp.RequestNotFoundError) {
			return fmt.Errorf("unable to retrieve the %q from the Perses API. %w", kind, apiError)
		}

		if errors.Is(apiError, perseshttp.RequestNotFoundError) {
			// the document doesn't exist, so we have to create it.
			if _, createError := svc.CreateResource(entity); createError != nil {
				return createError
			}
		} else {
			// the document doesn't exist, so we have to create it.
			if _, updateError := svc.UpdateResource(entity); updateError != nil {
				return updateError
			}
		}

		if outputError := resource.HandleSuccessMessage(o.writer, kind, project, fmt.Sprintf("object %q %q has been applied", kind, name)); outputError != nil {
			return outputError
		}
	}
	return nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "apply -f [FILENAME]",
		Short: "Create or update resources through a file. JSON or YAML format supported",
		Example: `
# Create/update the resources from the file resources.json to the remote Perses server.
percli apply -f ./resources.json

# Apply the JSON passed into stdin to the remote Perses server.
cat ./resources.json | percli apply -f -
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVarP(&o.project, "project", "p", o.project, "If present, the project scope for this CLI request.")
	cmd.Flags().StringVarP(&o.file, "file", "f", o.file, "Path to the file that contains the resources to create/update.")
	if err := cmd.MarkFlagRequired("file"); err != nil {
		logrus.Panic(err)
	}
	return cmd
}
