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

package apply

import (
	"errors"
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/internal/cli/service"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	opt.ProjectOption
	opt.FileOption
	opt.DirectoryOption
	writer    io.Writer
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'apply'")
	}
	if len(o.Directory) == 0 && len(o.File) == 0 {
		return fmt.Errorf("you need to set the flag --directory or --file for this command")
	}

	// Then, if no particular project has been specified through a flag, let's grab the one defined in the CLI config.
	// In this particular case, we don't use the Complete method of the ProjectOption because
	// we don't want to make this command fail if there is no project provided.
	// If we want to apply a project, there is no need to set a projectName for that
	if len(o.Project) == 0 {
		o.Project = config.Global.Project
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
	return o.applyEntity(entities)
}

func (o *option) applyEntity(entities []modelAPI.Entity) error {
	for _, entity := range entities {
		kind := modelV1.Kind(entity.GetKind())
		name := entity.GetMetadata().GetName()
		project := resource.GetProject(entity.GetMetadata(), o.Project)
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
		Use:   "apply (-f [FILENAME] | -d [DIRECTORY_NAME])",
		Short: "Create or update resources through a file. JSON or YAML format supported",
		Example: `
# Create/update the resources from the file resources.json to the remote Perses server.
percli apply -f ./resources.json

# Create/update any resources from a folder
percli apply -d ./

# Apply the JSON passed into stdin to the remote Perses server.
cat ./resources.json | percli apply -f -
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddProjectFlags(cmd, &o.ProjectOption)
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	opt.MarkFileAndDirFlagsAsXOR(cmd)
	return cmd
}
