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

package opt

import (
	"fmt"

	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type FileOption struct {
	File string
}

func AddFileFlags(cmd *cobra.Command, o *FileOption) {
	cmd.Flags().StringVarP(&o.File, "file", "f", o.File, "Path to the file that contains the resources consumed by the command.")
}

func MarkFileFlagAsMandatory(cmd *cobra.Command) {
	if err := cmd.MarkFlagRequired("file"); err != nil {
		logrus.Panic(err)
	}
}

type OutputOption struct {
	Output string
}

func (o *OutputOption) Complete() error {
	return output.ValidateAndSet(&o.Output)
}

func AddOutputFlags(cmd *cobra.Command, o *OutputOption) {
	cmd.Flags().StringVarP(&o.Output, "output", "o", "", "Kind of display: json or yaml. Default is yaml")
}

type ProjectOption struct {
	Project string
}

// Complete will fill the attribute ProjectOption.Project.
func (o *ProjectOption) Complete() error {
	if len(o.Project) == 0 {
		if len(config.Global.Project) == 0 {
			return fmt.Errorf("project is not defined. Please set it using the flag --project or using the command perses project <project_name>")
		}
		o.Project = config.Global.Project
	}
	return nil
}

func AddProjectFlags(cmd *cobra.Command, o *ProjectOption) {
	cmd.Flags().StringVarP(&o.Project, "project", "p", o.Project, "If present, the project scope for this CLI request")
}
