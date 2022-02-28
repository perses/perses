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
	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/perses/perses/pkg/client/api"
	"github.com/prometheus/common/version"
	"github.com/spf13/cobra"
)

type fullOutputVersion struct {
	Client *outputVersion `json:"client"`
	Server *outputVersion `json:"server,omitempty"`
}

type outputVersion struct {
	BuildTime string `json:"buildTime,omitempty" yaml:"buildTime,omitempty"`
	Version   string `json:"version" yaml:"version"`
	Commit    string `json:"commit,omitempty" yaml:"commit,omitempty"`
}

type option struct {
	short     bool
	output    string
	apiClient api.ClientInterface
}

func (o *option) complete() {
	apiClient, err := cmdUtils.GlobalConfig.GetAPIClient()
	if err != nil {
		return
	}
	o.apiClient = apiClient
}

func (o *option) validate() error {
	return cmdUtils.ValidateAndSetOutput(&o.output)
}

func (o *option) execute() error {
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
			return err
		}
		v.Server = &outputVersion{
			BuildTime: health.BuildTime,
			Version:   health.Version,
			Commit:    health.Commit,
		}
	}
	return cmdUtils.HandleOutput(o.output, v)
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "version",
		Short: "Display client version.",
		Run: func(cmd *cobra.Command, args []string) {
			o.complete()
			cmdUtils.HandleError(o.validate())
			cmdUtils.HandleError(o.execute())
		},
	}
	cmd.Flags().BoolVar(&o.short, "short", o.short, "If true, just print the version number.")
	cmd.Flags().StringVarP(&o.output, "output", "o", o.output, "One of 'yaml' or 'json'. Default is 'yaml'.")
	return cmd
}
