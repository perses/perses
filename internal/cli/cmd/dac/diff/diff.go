// Copyright 2024 The Perses Authors
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

package diff

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"

	"github.com/kylelemons/godebug/diff"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/pkg/client/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

func marshalIndent(dashboard *modelV1.Dashboard) ([]byte, error) {
	return json.MarshalIndent(dashboard.Spec, "", "  ")
}

func dashboardDiff(previous, after *modelV1.Dashboard) (string, error) {
	previousJSON, err := marshalIndent(previous)
	if err != nil {
		return "", err
	}
	afterJSON, err := marshalIndent(after)
	if err != nil {
		return "", err
	}
	return diff.Diff(string(previousJSON), string(afterJSON)), nil
}

type option struct {
	persesCMD.Option
	opt.ProjectOption
	opt.FileOption
	opt.DirectoryOption
	writer     io.Writer
	errWriter  io.Writer
	apiClient  api.ClientInterface
	dashboards []*modelV1.Dashboard
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'dac diff'")
	}
	if len(o.Directory) == 0 && len(o.File) == 0 {
		o.Directory = config.Global.Dac.OutputFolder
		if len(o.Directory) == 0 {
			return fmt.Errorf("you need to set the flag --directory or --file or to set the output folder for the 'dac' command")
		}
	}
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient
	return o.setDashboards()
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	for _, preview := range o.dashboards {
		project := resource.GetProject(preview.GetMetadata(), o.Project)
		dashboard, err := o.apiClient.V1().Dashboard(project).Get(preview.Metadata.Name)
		if err != nil {
			return err
		}
		d, err := dashboardDiff(dashboard, preview)
		if err != nil {
			return err
		}
		if writeErr := os.WriteFile(path.Join(config.Global.Dac.OutputFolder, fmt.Sprintf("%s-%s.diff", project, dashboard.Metadata.Name)), []byte(d), 0644); writeErr != nil { // nolint: gosec
			return fmt.Errorf("unable to write the diff file: %w", writeErr)
		}
	}
	return nil
}

func (o *option) setDashboards() error {
	entities, err := file.UnmarshalEntities(o.File, o.Directory)
	if err != nil {
		return err
	}
	for _, e := range entities {
		if e.GetKind() == string(modelV1.KindDashboard) {
			o.dashboards = append(o.dashboards, e.(*modelV1.Dashboard))
		}
	}
	if len(o.dashboards) == 0 {
		return fmt.Errorf("no dashboard found to create the diff")
	}
	return nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "diff (-f [FILENAME] | -d [DIRECTORY_NAME])",
		Short: "Generate diff(s) between online dashboard(s) and local one(s)",
		Example: `
percli dac diff -d ./build
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddProjectFlags(cmd, &o.ProjectOption)
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	return cmd
}
