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

package project

import (
	"errors"
	"fmt"
	cmdUtils "github.com/perses/perses/internal/cli/utils"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/spf13/cobra"
)

type option struct {
	projectName string
	apiClient   v1.ProjectInterface
}

func (o *option) complete(args []string) error {
	if len(args) > 1 {
		return fmt.Errorf("only the project's can be specified as an argument")
	}
	if len(args) == 1 {
		o.projectName = args[0]
	}
	apiClient, err := cmdUtils.GlobalConfig.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient.V1().Project()
	return nil
}

func (o *option) execute() error {
	if len(o.projectName) == 0 {
		// In that case we simply print the current project used.
		fmt.Printf("Using project %q on server %q", cmdUtils.GlobalConfig.Project, cmdUtils.GlobalConfig.RestClientConfig.URL)
		return nil
	} else {
		// in case the project is provided we should verify if it exists first
		_, err := o.apiClient.Get(o.projectName)
		if err != nil {
			if errors.Is(err, perseshttp.RequestNotFoundError) {
				return fmt.Errorf("project %q doesn't exist", o.projectName)
			}
			return err
		}
		// Set the project in the config
		if configError := cmdUtils.SetProject(o.projectName); configError != nil {
			return configError
		}
		fmt.Printf("project %s selected", o.projectName)
		return nil
	}
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "project [NAME]",
		Short: "Select the project used by default",
		Long: `Select a project as a default project to use for later. 
The project to be used is stored in the configuration file located at ${USERHOME}/.perses/config

If no project is specified in the command line, it will instead display the current project used.`,
		Example: `
# Switch to 'myapp' project
percli project myapp

# display the project currently used
percli project
`,
		Run: func(cmd *cobra.Command, args []string) {
			cmdUtils.HandleError(o.complete(args))
			cmdUtils.HandleError(o.execute())
		},
	}
	return cmd
}
