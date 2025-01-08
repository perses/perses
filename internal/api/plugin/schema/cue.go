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

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/load"
)

const kindPath = "kind"

func LoadModelSchema(schemaPath string) (string, *build.Instance, error) {
	ctx := cuecontext.New(cuecontext.EvaluatorVersion(cuecontext.EvalV3))
	schemaInstance, err := loadSchemaInstance(schemaPath, "model")
	if err != nil {
		return "", nil, err
	}
	// We are building the value from instance so we can read the kind value.
	sch := ctx.BuildInstance(schemaInstance)
	if sch.Err() != nil {
		return "", nil, sch.Err()
	}
	kindValue := sch.LookupPath(cue.ParsePath(kindPath))
	if kindValue.Err() != nil {
		return "", nil, fmt.Errorf("unable to retrieve the kind value: %w", kindValue.Err())
	}
	kind, err := kindValue.String()
	if err != nil {
		return "", nil, fmt.Errorf("unable to retrieve the kind value: %w", err)
	}
	return kind, schemaInstance, nil
}

func loadSchemaInstance(schemaPath string, pkg string) (*build.Instance, error) {
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
		return nil, buildInstance.Err
	}
	return buildInstance, nil
}
