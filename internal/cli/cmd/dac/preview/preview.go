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

package preview

import (
	"fmt"
	"io"
	"net/url"
	"strings"

	"github.com/perses/perses/internal/api/utils"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/internal/cli/resource"
	"github.com/perses/perses/internal/cli/service"
	"github.com/perses/perses/pkg/client/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type previewResponse struct {
	Project   string `json:"project" yaml:"project"`
	Dashboard string `json:"dashboard" yaml:"dashboard"`
	Preview   string `json:"preview" yaml:"preview"`
}

func newEphemeralDashboard(project string, name string, ttl model.Duration, dashboard *modelV1.Dashboard) *modelV1.EphemeralDashboard {
	return &modelV1.EphemeralDashboard{
		Kind: modelV1.KindEphemeralDashboard,
		Metadata: modelV1.ProjectMetadata{
			Metadata:               modelV1.Metadata{Name: name},
			ProjectMetadataWrapper: modelV1.ProjectMetadataWrapper{Project: project},
		},
		Spec: modelV1.EphemeralDashboardSpec{
			EphemeralDashboardSpecBase: modelV1.EphemeralDashboardSpecBase{TTL: ttl},
			DashboardSpec:              dashboard.Spec,
		},
	}
}

type option struct {
	persesCMD.Option
	opt.ProjectOption
	opt.FileOption
	opt.DirectoryOption
	opt.OutputOption
	dashboards   []*modelV1.Dashboard
	writer       io.Writer
	errWriter    io.Writer
	apiClient    api.ClientInterface
	ttl          model.Duration
	ttlAsAString string
	prefix       string
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'dac preview'")
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
	ttl, err := model.ParseDuration(o.ttlAsAString)
	if err != nil {
		return err
	}
	o.ttl = ttl
	return o.setDashboards()
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	var response []previewResponse
	for _, dashboard := range o.dashboards {
		project := resource.GetProject(dashboard.GetMetadata(), o.Project)
		name := o.computeEphemeralDashboardName(dashboard.Metadata.Name)
		ephemeralDashboard := newEphemeralDashboard(project, name, o.ttl, dashboard)
		svc, svcErr := service.New(modelV1.KindEphemeralDashboard, project, o.apiClient)
		if svcErr != nil {
			return svcErr
		}

		if upsertError := service.Upsert(svc, ephemeralDashboard); upsertError != nil {
			return upsertError
		}
		response = append(response, o.buildPreviewResponse(dashboard, ephemeralDashboard))

		logrus.Infof("ephemeral dashboard %q has been applied in the project %q", name, project)
	}
	return output.Handle(o.writer, o.Output, response)
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
		return fmt.Errorf("no dashboard found to create a preview")
	}
	return nil
}

func (o *option) computeEphemeralDashboardName(dashboardName string) string {
	var result strings.Builder
	if len(o.prefix) > 0 {
		result.WriteString(fmt.Sprintf("%s-", strings.ReplaceAll(strings.ToLower(o.prefix), " ", "-")))
	}
	result.WriteString(dashboardName)
	return result.String()
}

func (o *option) buildPreviewResponse(dashboard *modelV1.Dashboard, tmpDashboard *modelV1.EphemeralDashboard) previewResponse {
	finalURL := &url.URL{}
	*finalURL = *o.apiClient.RESTClient().BaseURL
	finalURL.Path = fmt.Sprintf("/%s/%s/%s/%s", utils.PathProject, tmpDashboard.Metadata.Project, utils.PathEphemeralDashboard, tmpDashboard.Metadata.Name)
	return previewResponse{
		Dashboard: dashboard.Metadata.Name,
		Project:   tmpDashboard.Metadata.Project,
		Preview:   finalURL.String()}
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
		Use:   "preview (-f [FILENAME] | -d [DIRECTORY_NAME])",
		Short: "Generate preview(s) of dashboard(s)",
		Long:  "Creates ephemeral dashboard(s) based on the dashboard(s) built locally. As a response it gives the list of the URL for each dashboard preview.",
		Example: `
percli dac preview -d ./build
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddOutputFlags(cmd, &o.OutputOption)
	opt.AddProjectFlags(cmd, &o.ProjectOption)
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.AddDirectoryFlags(cmd, &o.DirectoryOption)
	cmd.Flags().StringVar(&o.ttlAsAString, "ttl", "1d", "Time To Live of the dashboard preview")
	cmd.Flags().StringVar(&o.prefix, "prefix", "", "If provided, it is used to prefix the dashboard preview name")
	return cmd
}
