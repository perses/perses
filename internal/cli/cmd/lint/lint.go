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

package lint

import (
	"fmt"
	"io"

	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/perses/perses/internal/cli/output"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	opt.FileOption
	writer         io.Writer
	chartsSchemas  string
	queriesSchemas string
	sch            schemas.Schemas
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'lint'")
	}
	if len(o.chartsSchemas) > 0 && len(o.queriesSchemas) > 0 {
		o.sch = schemas.New(config.Schemas{
			PanelsPath:  o.chartsSchemas,
			QueriesPath: o.queriesSchemas,
		})
	}
	return nil
}

func (o *option) Validate() error {
	return nil
}

func (o *option) Execute() error {
	objects, err := file.UnmarshalEntity(o.File)
	if err != nil {
		return err
	}
	if validateErr := o.validate(objects); validateErr != nil {
		return validateErr
	}
	return output.HandleString(o.writer, "your resources look good")
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) validate(objects []modelAPI.Entity) error {
	if o.sch == nil {
		return nil
	}
	for _, object := range objects {
		entity, ok := object.(*modelV1.Dashboard)
		if ok {
			if err := o.sch.ValidatePanels(entity.Spec.Panels); err != nil {
				return err
			}
		}
	}
	return nil
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "lint -f [FILENAME]",
		Short: "Static check of the resources",
		Long: `
The lint command will check statically that your resources are valid. 
It doesn't necessary mean you won't face any issue when applying them.

JSON and YAML formats are accepted.
`,
		Example: `
# Check resources from a JSON file
percli lint -f ./resources.json

# Check resources from stdin.
cat resources.json | percli lint -f -
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	opt.AddFileFlags(cmd, &o.FileOption)
	opt.MarkFileFlagAsMandatory(cmd)
	cmd.Flags().StringVar(&o.chartsSchemas, "schemas.charts", "", "Path to the CUE schemas for charts.")
	cmd.Flags().StringVar(&o.queriesSchemas, "schemas.queries", "", "Path to the CUE schemas for queries.")
	cmd.MarkFlagsRequiredTogether("schemas.charts", "schemas.queries")
	return cmd
}
