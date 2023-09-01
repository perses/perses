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

package remove

import (
	"fmt"
	"io"
	"sort"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/internal/cli/service"
	"github.com/perses/perses/pkg/client/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

// keyCombination is a struct that contains a combination of the project name and the name of the resource.
// These two information are used to delete a unique resource.
// kind is used to instantiate the correct client.
type keyCombination struct {
	kind    modelV1.Kind
	project string
	name    string
}

type option struct {
	persesCMD.Option
	opt.FileOption
	opt.ProjectOption
	writer    io.Writer
	kind      modelV1.Kind
	all       bool
	names     []keyCombination
	apiClient api.ClientInterface
}

func (o *option) Complete(args []string) error {
	if len(o.Project) == 0 {
		o.Project = config.Global.Project
	}
	if len(o.File) == 0 {
		// Then the user need to specify the resource type and the name of the resource to delete
		if len(args) == 0 {
			return fmt.Errorf(resource.FormatMessage())
		}
		var err error
		o.kind, err = resource.GetKind(args[0])
		if err != nil {
			return err
		}
		if !o.all && len(args) < 2 {
			return fmt.Errorf("you have to specify the resource name you would like to delete")
		}
	}
	// Set the API Client to used
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient
	// Complete the list of resources to bind
	return o.completeNames(args)
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	sort.Slice(o.names, func(i, j int) bool {
		return o.names[i].kind <= o.names[j].kind &&
			o.names[i].name <= o.names[j].name &&
			o.names[i].project <= o.names[j].project
	})
	for _, key := range o.names {
		kind := key.kind
		name := key.name
		project := key.project
		svc, svcErr := service.New(kind, project, o.apiClient)
		if svcErr != nil {
			return svcErr
		}
		if err := svc.DeleteResource(name); err != nil {
			return err
		}
		if outputError := resource.HandleSuccessMessage(o.writer, kind, project, fmt.Sprintf("object %q %q has been deleted", kind, name)); outputError != nil {
			return outputError
		}
	}
	return nil
}

func (o *option) completeNames(args []string) error {
	if len(o.File) > 0 {
		if err := o.setNamesFromFile(); err != nil {
			return err
		}
	} else if o.all {
		if err := o.setNamesFromAll(); err != nil {
			return err
		}
	} else {
		o.setNamesFromArgs(args)
	}
	return nil
}

func (o *option) setNamesFromArgs(args []string) {
	for _, name := range args[1:] {
		o.names = append(o.names, keyCombination{
			kind:    o.kind,
			name:    name,
			project: o.Project,
		})
	}
}

func (o *option) setNamesFromAll() error {
	svc, svcErr := service.New(o.kind, o.Project, o.apiClient)
	if svcErr != nil {
		return svcErr
	}
	list, err := svc.ListResource("")
	if err != nil {
		return err
	}
	o.setNames(list)
	return nil
}

func (o *option) setNamesFromFile() error {
	entities, err := file.UnmarshalEntity(o.File)
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
		o.names = append(o.names, keyCombination{
			kind:    kind,
			name:    metadata.GetName(),
			project: resource.GetProject(metadata, o.Project),
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
cat data.json | percli delete -f -

# Delete a specific dashboard
percli delete dashboards node_exporter cadvisor

# Delete all dashboards
percli delete dashboards --all
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddProjectFlags(cmd, &o.ProjectOption)
	cmd.Flags().BoolVarP(&o.all, "all", "a", o.all, "Delete all resources in the project of the specified resource types.")
	return cmd
}
