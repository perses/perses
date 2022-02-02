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
	"github.com/prometheus/common/version"
	"github.com/spf13/cobra"
)

type outputVersion struct {
	BuildTime string `json:"buildTime,omitempty" yaml:"buildTime,omitempty"`
	Version   string `json:"version" yaml:"version"`
	Commit    string `json:"commit,omitempty" yaml:"commit,omitempty"`
}

type option struct {
	short  bool
	output string
}

func (o *option) validate() error {
	if o.output != "" {
		return cmdUtils.ValidateOutput(o.output)
	} else {
		o.output = "yaml"
		return nil
	}
}

func (o *option) execute() error {
	v := &outputVersion{
		Version: version.Version,
	}
	if !o.short {
		v.BuildTime = version.BuildDate
		v.Commit = version.Revision
	}
	return cmdUtils.HandleOutput(o.output, v)
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "version",
		Short: "Display client version",
		Run: func(cmd *cobra.Command, args []string) {
			cmdUtils.HandleError(o.validate())
			cmdUtils.HandleError(o.execute())
		},
	}
	cmd.Flags().BoolVar(&o.short, "short", o.short, "If true, just print the version number.")
	cmd.Flags().StringVarP(&o.output, "output", "o", o.output, "One of 'yaml' or 'json'. Default is 'yaml'")
	return cmd
}
