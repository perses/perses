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

package version

import (
	"io"

	"github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/prometheus/common/version"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type fullOutputVersion struct {
	Client *outputVersion `json:"client"`
	Server *outputVersion `json:"server,omitempty" yaml:"server,omitempty"`
}

type outputVersion struct {
	BuildTime string `json:"buildTime,omitempty" yaml:"buildTime,omitempty"`
	Version   string `json:"version" yaml:"version"`
	Commit    string `json:"commit,omitempty" yaml:"commit,omitempty"`
}

type option struct {
	persesCMD.Option
	opt.OutputOption
	writer    io.Writer
	short     bool
	apiClient api.ClientInterface
}

func (o *option) Complete(_ []string) error {
	// Complete the output
	if outputErr := o.OutputOption.Complete(); outputErr != nil {
		return outputErr
	}
	apiClient, err := config.Global.GetAPIClient()
	// In case you are not connected to any API, it is still fine.
	logrus.WithError(err).Debug("unable to get the api client from config")
	o.apiClient = apiClient
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	clientVersion := &outputVersion{
		Version: version.Version,
	}
	v := &fullOutputVersion{
		Client: clientVersion,
	}
	if !o.short {
		clientVersion.BuildTime = version.BuildDate
		clientVersion.Commit = version.Revision
	}
	if o.apiClient != nil {
		health, err := o.apiClient.V1().Health().Check()
		if err != nil {
			logrus.WithError(err).Error("unable to get the server version")
		} else {
			v.Server = &outputVersion{
				BuildTime: health.BuildTime,
				Version:   health.Version,
				Commit:    health.Commit,
			}
		}
	}
	return output.Handle(o.writer, o.Output, v)
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "version",
		Short: "Display client version.",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddOutputFlags(cmd, &o.OutputOption)
	cmd.Flags().BoolVar(&o.short, "short", o.short, "If true, just print the version number.")
	return cmd
}
