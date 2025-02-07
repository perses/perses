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

package update

import (
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/cli/cmd"
	"github.com/perses/perses/cli/cue"
	"github.com/perses/perses/cli/output"
	"github.com/perses/perses/cli/sources"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

const (
	commonSchemasPath = "cue/schemas/common/"
)

type option struct {
	persesCMD.Option
	writer    io.Writer
	errWriter io.Writer
	version   string
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'update'")
	}

	version, err := sources.GetProperVersion(o.version)
	if err != nil {
		return err
	}
	o.version = version

	return nil
}

func (o *option) Validate() error {
	return sources.EnsureMinValidVersion(o.version)
}

func (o *option) Execute() error {
	logrus.Debugf("Updating common package dependency using Perses %s", o.version)

	if err := cue.InstallCueDepsFromSources(commonSchemasPath, o.version); err != nil {
		return fmt.Errorf("error installing the common CUE package as a dependency: %v", err)
	}

	return output.HandleString(o.writer, "Common package dependency successfully updated")
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
		Use:   "update",
		Short: "Update the perses' `common` CUE package dependency. To be used for plugin development purpose only.",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().StringVar(&o.version, "version", "", "Version of Perses from which to retrieve the `common` CUE package.")

	return cmd
}
