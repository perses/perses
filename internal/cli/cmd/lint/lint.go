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

	"github.com/perses/perses/internal/api/impl/v1/dashboard/schemas"
	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/perses/perses/internal/cli/utils/file"
	"github.com/perses/perses/internal/config"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type option struct {
	cmdUtils.CMDOption
	writer    io.Writer
	file      string
	schemas   string
	validator schemas.Validator
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'lint'")
	}
	if len(o.schemas) > 0 {
		o.validator = schemas.NewValidator(config.Schemas{Path: o.schemas})
	}
	return nil
}

func (o *option) Validate() error {
	if len(o.file) == 0 {
		return fmt.Errorf("file must be provided")
	}
	if o.validator != nil {
		if err := o.validator.Initialize(); err != nil {
			return err
		}
	}
	return nil
}

func (o *option) Execute() error {
	unmarshaller := file.Unmarshaller{}
	objects, err := unmarshaller.Unmarshal(o.file)
	if err != nil {
		return err
	}
	if validateErr := o.validate(objects); validateErr != nil {
		return validateErr
	}
	return cmdUtils.HandleString(o.writer, "your resources look good")
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) validate(objects []modelAPI.Entity) error {
	if o.validator == nil {
		return nil
	}
	for _, object := range objects {
		entity, ok := object.(*modelV1.Dashboard)
		if ok {
			if err := o.validator.Validate(entity.Spec.Panels); err != nil {
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
			return cmdUtils.RunCMD(o, cmd, args)
		},
	}
	cmd.Flags().StringVarP(&o.file, "file", "f", o.file, "Path to the file that contains the resources to check.")
	cmd.Flags().StringVar(&o.schemas, "schemas", "", "Path to the CUE schemas.")
	if err := cmd.MarkFlagRequired("file"); err != nil {
		logrus.Fatal(err)
	}
	return cmd
}
