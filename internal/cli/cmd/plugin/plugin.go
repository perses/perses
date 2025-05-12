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

package plugin

import (
	"github.com/perses/perses/internal/cli/cmd/plugin/build"
	"github.com/perses/perses/internal/cli/cmd/plugin/lint"
	"github.com/perses/perses/internal/cli/cmd/plugin/list"
	"github.com/perses/perses/internal/cli/cmd/plugin/start"
	"github.com/spf13/cobra"
)

func NewCMD() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "plugin",
		Short: "Commands related to plugins development",
	}
	cmd.AddCommand(build.NewCMD())
	cmd.AddCommand(lint.NewCMD())
	cmd.AddCommand(list.NewCMD())
	cmd.AddCommand(start.NewCMD())

	return cmd
}
