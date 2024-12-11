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

package migrate

import (
	"os"
	"path/filepath"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/sirupsen/logrus"
)

const grafanaType = "#grafanaType"

func loadSliceOfInstance(path string) ([]*build.Instance, error) {
	var result []*build.Instance
	files, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	for _, file := range files {
		if !file.IsDir() {
			logrus.Tracef("file %s is ignored since we are looking for directories", file.Name())
			continue
		}
		schemaPath := filepath.Join(path, file.Name())
		if _, fileErr := os.Stat(filepath.Join(schemaPath, "migrate.cue")); os.IsNotExist(fileErr) {
			// migration file doesn't exist
			continue
		}
		buildInstance, loadErr := schemas.LoadMigrateSchema(schemaPath)
		if loadErr != nil {
			return nil, loadErr
		}
		result = append(result, buildInstance)
	}
	return result, nil
}

func loadPanels(panelSchemaPath string) (map[string]*build.Instance, error) {
	ctx := cuecontext.New(cuecontext.EvaluatorVersion(cuecontext.EvalV3))
	result := make(map[string]*build.Instance)
	files, err := os.ReadDir(panelSchemaPath)
	if err != nil {
		return nil, err
	}
	for _, file := range files {
		if !file.IsDir() {
			logrus.Tracef("file %s is ignored since we are looking for directories", file.Name())
			continue
		}
		schemaPath := filepath.Join(panelSchemaPath, file.Name())
		if _, fileErr := os.Stat(filepath.Join(schemaPath, "migrate.cue")); os.IsNotExist(fileErr) {
			// migration file doesn't exist
			continue
		}
		buildInstance, loadErr := schemas.LoadMigrateSchema(schemaPath)
		if loadErr != nil {
			return nil, loadErr
		}
		schema := ctx.BuildInstance(buildInstance)
		kindValue := schema.LookupPath(cue.ParsePath(grafanaType))
		kind := kindValue.Kind()

		if kind == cue.StringKind {
			kindAsString, _ := kindValue.String()
			result[kindAsString] = buildInstance
		} else if kind == cue.BottomKind && kindValue.IncompleteKind() == cue.StringKind {
			op, values := kindValue.Expr()
			if op != cue.AndOp && op != cue.OrOp {
				logrus.Tracef("unable to load migrate script from plugin %q: op in field %q not recognised", schemaPath, grafanaType)
				continue
			}
			for _, value := range values {
				if value.Kind() != cue.StringKind {
					logrus.Tracef("in plugin %q value not decoded as it is of type %q ", schemaPath, value.Kind())
					continue
				}
				valueAsString, _ := value.String()
				result[valueAsString] = buildInstance
			}
		}
	}
	return result, nil
}
