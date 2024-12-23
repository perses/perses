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

package lint

import (
	"fmt"
	"io"
	"os"

	"github.com/perses/perses/internal/api/schemas"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/output"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	schemaFolder string
	writer       io.Writer
	errWriter    io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'update'")
	}
	return nil
}

func (o *option) Validate() error {
	if _, err := os.Stat(o.schemaFolder); os.IsNotExist(err) {
		return fmt.Errorf("folder %s does not exist or has not been found", o.schemaFolder)
	}
	return nil
}

func (o *option) Execute() error {
	if _, err := schemas.Load(o.schemaFolder); err != nil {
		return err
	}
	return output.HandleString(o.writer, "current plugin is valid")
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
		Use:   "lint",
		Short: "Validate the plugin model. To be used for plugin development purpose only.",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.schemaFolder, "schemas-path", "schemas", "Path to the folder containing the cuelang schema")
	return cmd
}
