// Copyright 2025 The Perses Authors
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

package schema

import (
	"fmt"
	"os"
	"path/filepath"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/load"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

var cueValidationOptions = []cue.Option{
	cue.Concrete(true),
	cue.Attributes(true),
	cue.Definitions(true),
	cue.Hidden(true),
}

func LoadModelSchema(schemaPath string) (string, *build.Instance, error) {
	ctx := cuecontext.New()
	schemaInstance, err := LoadSchemaInstance(schemaPath, "model")
	if err != nil {
		return "", nil, err
	}
	// We are building the value from instance so we can read the kind value.
	schema := ctx.BuildInstance(schemaInstance)
	if schema.Err() != nil {
		return "", nil, schema.Err()
	}
	// Check the presence & type of `kind`
	kindValue := schema.LookupPath(cue.ParsePath("kind"))
	if kindValue.Err() != nil {
		return "", nil, fmt.Errorf("invalid schema at %s: required `kind` field is missing: %w", schemaPath, kindValue.Err())
	}
	kind, err := kindValue.String()
	if err != nil {
		return "", nil, fmt.Errorf("invalid schema at %s: `kind` is not a string: %w", schemaPath, err)
	}
	// Check the presence & type of `spec`
	specValue := schema.LookupPath(cue.ParsePath("spec"))
	if specValue.Err() != nil {
		return "", nil, fmt.Errorf("invalid schema at %s: required `spec` field is missing: %w", schemaPath, specValue.Err())
	}
	specKind := specValue.Kind()
	// NB: not perfect check. We accept BottomKind as it is returned in valid cases (empty struct, disjunction..),
	// but it is also returned in invalid cases (spec: number, spec: string..). Unfortunately we can't make this smarter here.
	if specKind != cue.StructKind && specKind != cue.BottomKind {
		return "", nil, fmt.Errorf("invalid schema at %s: `spec` is of wrong type %q", schemaPath, specKind)
	}

	return kind, schemaInstance, nil
}

func LoadSchemaInstance(schemaPath string, pkg string) (*build.Instance, error) {
	// load the cue files into build.Instances slice
	// package `model` is imposed so that we don't mix model-related files with migration-related files
	buildInstances := load.Instances([]string{}, &load.Config{Dir: schemaPath, Package: pkg})
	// we strongly assume that only 1 buildInstance should be returned, otherwise we skip it
	// TODO can probably be improved
	if len(buildInstances) != 1 {
		return nil, fmt.Errorf("the number of build instances is != 1")
	}
	buildInstance := buildInstances[0]

	// check for errors on the instances
	if buildInstance.Err != nil {
		return nil, fmt.Errorf("failed to load schema from %q: %w", schemaPath, buildInstance.Err)
	}
	return buildInstance, nil
}

func validatePlugin(plugin common.Plugin, schema *build.Instance, pluginType string, pluginName string) error {
	if schema == nil {
		return fmt.Errorf("schema not found for plugin %s", plugin.Kind)
	}
	pluginData, err := plugin.JSONMarshal()
	if err != nil {
		logrus.WithError(err).Debugf("unable to marshal the plugin %q", plugin.Kind)
		return err
	}
	ctx := cuecontext.New()
	pluginValue := ctx.CompileBytes(pluginData)
	finalValue := pluginValue.Unify(ctx.BuildInstance(schema))
	if validateErr := finalValue.Validate(cueValidationOptions...); validateErr != nil {
		// retrieve the full error detail to provide better insights to the end user:
		ex, errOs := os.Executable()
		if errOs != nil {
			logrus.WithError(errOs).Error("Error retrieving exec path to build CUE error detail")
		}
		fullErrStr := errors.Details(validateErr, &errors.Config{Cwd: filepath.Dir(ex)})
		logrus.Debug(fullErrStr)

		return fmt.Errorf("invalid %s %s: %s", pluginType, pluginName, fullErrStr)
	}
	return nil
}
