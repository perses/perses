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

package dac

import (
	"github.com/perses/perses/internal/cli/cmd/dac/build"
	"github.com/perses/perses/internal/cli/cmd/dac/diff"
	"github.com/perses/perses/internal/cli/cmd/dac/preview"
	"github.com/perses/perses/internal/cli/cmd/dac/setup"
	"github.com/perses/perses/internal/cli/config"
	"github.com/spf13/cobra"
)

var dacOutputFolder string

func Initialize() {
	config.Global.Dac.OutputFolder = dacOutputFolder
}

func NewCMD() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "dac",
		Short: "Commands related to Dashboard-as-Code",
	}
	cmd.AddCommand(build.NewCMD())
	cmd.AddCommand(diff.NewCMD())
	cmd.AddCommand(preview.NewCMD())
	cmd.AddCommand(setup.NewCMD())

	cmd.PersistentFlags().StringVar(&dacOutputFolder, "dac.output_folder", config.DefaultOutputFolder, "Path to the folder where the dac-generated files are stored.")

	return cmd
}
