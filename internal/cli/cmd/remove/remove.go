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

package remove

import (
	"fmt"
	"io"

	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/perses/perses/internal/cli/utils/file"
	cmdUtilsService "github.com/perses/perses/internal/cli/utils/service"
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

// keyCombination is a struct that contains a combination of the project name and the name of the resource.
// These two information are used to delete an unique resource.
type keyCombination struct {
	project string
	name    string
}

type option struct {
	cmdUtils.CMDOption
	writer    io.Writer
	kind      modelV1.Kind
	all       bool
	file      string
	project   string
	names     map[modelV1.Kind][]keyCombination
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	o.names = make(map[modelV1.Kind][]keyCombination)
	if len(o.file) == 0 {
		// Then the user need to specify the resource type and the name of the resource to delete
		if len(args) == 0 {
			return fmt.Errorf(cmdUtils.FormatAvailableResourcesMessage())
		}

		var err error
		o.kind, err = cmdUtils.GetKind(args[0])
		if err != nil {
			return err
		}

		if !o.all && len(args) <= 1 {
			return fmt.Errorf("you have to specify the resource name you would like to delete")
		}

		for _, name := range args[1:] {
			o.names[o.kind] = append(o.names[o.kind], keyCombination{
				name:    name,
				project: o.project,
			})
		}
	}
	// Then, if no particular project has been specified through a flag, let's grab the one defined in the CLI config.
	if len(o.project) == 0 {
		o.project = cmdUtils.GlobalConfig.Project
	}
	var err error
	o.apiClient, err = cmdUtils.GlobalConfig.GetAPIClient()
	return err
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	if len(o.file) > 0 {
		if err := o.setNamesFromFile(); err != nil {
			return err
		}
	} else if o.all {
		if err := o.setNamesFromAll(); err != nil {
			return err
		}
	}
	for kind, keys := range o.names {
		for _, key := range keys {
			name := key.name
			project := key.project
			svc, svcErr := cmdUtilsService.NewService(kind, project, o.apiClient)
			if svcErr != nil {
				return svcErr
			}
			if err := svc.DeleteResource(name); err != nil {
				return err
			}
			if outputError := cmdUtils.HandleSuccessResourceMessage(o.writer, kind, project, fmt.Sprintf("object %q %q has been deleted", kind, name)); outputError != nil {
				return outputError
			}
		}
	}
	return nil
}

func (o *option) setNamesFromAll() error {
	svc, svcErr := cmdUtilsService.NewService(o.kind, o.project, o.apiClient)
	if svcErr != nil {
		return svcErr
	}
	list, err := svc.ListResource("")
	if err != nil {
		return err
	}
	entities, err := cmdUtils.ConvertToEntity(list)
	if err != nil {
		return err
	}
	o.setNames(entities)
	return nil
}

func (o *option) setNamesFromFile() error {
	unmarshaller := file.Unmarshaller{}
	entities, err := unmarshaller.Unmarshal(o.file)
	if err != nil {
		return err
	}
	o.setNames(entities)
	return nil
}

func (o *option) setNames(entities []modelAPI.Entity) {
	for _, entity := range entities {
		kind := modelV1.Kind(entity.GetKind())
		metadata := entity.GetMetadata()
		o.names[kind] = append(o.names[kind], keyCombination{
			name:    metadata.GetName(),
			project: cmdUtils.GetProject(metadata, o.project),
		})
	}
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "delete (-f [FILENAME] | TYPE ([NAME1 NAME2] | --all))",
		Short: "Delete resources",
		Long: `
JSON and YAML formats are accepted.

If both a filename and command line arguments are passed, the command line arguments are used and the filename is
ignored.

Note that the delete command does NOT do resource version checks, so if someone submits an update to a resource right
when you submit a delete, their update will be lost along with the rest of the resource.
`,
		Example: `
# Delete any kind of resources from a file
percli delete -f data.json

# Delete any kind of resources from stdin
percli data.json | percli delete -f -

# Delete a specific dashboard
percli delete dashboards node_exporter cadvisor

# Delete all dashboards
percli delete dashboards --all
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return cmdUtils.RunCMD(o, cmd, args)
		},
	}
	cmd.Flags().StringVarP(&o.file, "file", "f", o.file, "Path to the file that contains the resources to delete")
	cmd.Flags().BoolVarP(&o.all, "all", "a", o.all, "Delete all resources in the project of the specified resource types.")
	cmd.Flags().StringVarP(&o.project, "project", "p", o.project, "If present, the project scope for this CLI request")
	return cmd
}
