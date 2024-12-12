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

package opt

import (
	"fmt"
	"os"

	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type DirectoryOption struct {
	Directory string
}

func (o *DirectoryOption) Validate() error {
	// Check if the path corresponds to an existing directory.
	_, err := os.Stat(o.Directory)
	if err != nil {
		return fmt.Errorf("invalid value set to the Directory flag: %v", err)
	}

	return nil
}

func AddDirectoryFlags(cmd *cobra.Command, o *DirectoryOption) {
	cmd.Flags().StringVarP(&o.Directory, "directory", "d", "", "Path to the directory containing the resources consumed by the command.")
}

type FileOption struct {
	File string
}

func (o *FileOption) Validate() error {
	// Nothing to check when the file content is passed via stdin
	if o.File == "-" {
		return nil
	}

	// Check if the path corresponds to an existing file or directory.
	_, err := os.Stat(o.File)
	if err != nil {
		return fmt.Errorf("invalid value set to the File flag: %v", err)
	}

	return nil
}

func AddFileFlags(cmd *cobra.Command, o *FileOption) {
	cmd.Flags().StringVarP(&o.File, "file", "f", o.File, "Path to the file that contains the resources consumed by the command.")
}

func MarkFileFlagAsMandatory(cmd *cobra.Command) {
	if err := cmd.MarkFlagRequired("file"); err != nil {
		logrus.Panic(err)
	}
}

func MarkFileAndDirFlagsAsXOR(cmd *cobra.Command) {
	cmd.MarkFlagsOneRequired("file", "directory")
	cmd.MarkFlagsMutuallyExclusive("file", "directory")
}

type OutputOption struct {
	Output string
}

func (o *OutputOption) Complete() error {
	return output.ValidateAndSet(&o.Output)
}

func AddOutputFlags(cmd *cobra.Command, o *OutputOption) {
	cmd.Flags().StringVarP(&o.Output, "output", "o", "", "Format of the output: json or yaml (default is yaml).")
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
