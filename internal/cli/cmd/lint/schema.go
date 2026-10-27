// Copyright The Perses Authors
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
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/cuecontext"
	cueJSON "cuelang.org/go/encoding/json"
	cueYAML "cuelang.org/go/encoding/yaml"
	apiCue "github.com/perses/perses/internal/api/cue"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

const dashboardDefinition = "#Dashboard"

// loadDashboardSchema loads the complete dashboard schema, as served by the endpoint /api/v1/schemas/dashboards.
func loadDashboardSchema(path string) (*dashboardSchema, error) {
	data, err := os.ReadFile(path) //nolint: gosec
	if err != nil {
		return nil, err
	}
	ctx := cuecontext.New()
	root := ctx.CompileBytes(data, cue.Filename(path))
	if root.Err() != nil {
		return nil, fmt.Errorf("unable to load the schema %q: %w", path, root.Err())
	}
	definition := root.LookupPath(cue.ParsePath(dashboardDefinition))
	if !definition.Exists() {
		return nil, fmt.Errorf("the schema %q doesn't define %s", path, dashboardDefinition)
	}
	return &dashboardSchema{ctx: ctx, definition: definition}, nil
}

// decodeResources decodes the content of a file with the CUE decoders, so the values are exactly the ones written in the file.
// Like in the package internal/cli/file, a JSON file or each document of a YAML file contains a resource or a list of resources.
// The empty YAML documents are decoded as null, so they are skipped like any resource that is not a dashboard.
func decodeResources(ctx *cue.Context, file string, data []byte, isJSON bool) ([]cue.Value, error) {
	var exprs []ast.Expr
	if isJSON {
		expr, err := cueJSON.Extract(file, data)
		if err != nil {
			return nil, err
		}
		exprs = append(exprs, expr)
	} else {
		decoder := cueYAML.NewDecoder(file, bytes.NewReader(data))
		for {
			expr, err := decoder.Extract()
			if errors.Is(err, io.EOF) {
				break
			}
			if err != nil {
				return nil, err
			}
			exprs = append(exprs, expr)
		}
	}
	var resources []cue.Value
	for _, expr := range exprs {
		value := ctx.BuildExpr(expr)
		if value.Err() != nil {
			return nil, value.Err()
		}
		if value.Kind() != cue.ListKind {
			resources = append(resources, value)
			continue
		}
		iter, err := value.List()
		if err != nil {
			return nil, err
		}
		for iter.Next() {
			resources = append(resources, iter.Value())
		}
	}
	return resources, nil
}

type dashboardSchema struct {
	ctx        *cue.Context
	definition cue.Value
}

// validate validates the dashboards of the file against the definition #Dashboard.
// It is the equivalent of "cue vet -d '#Dashboard' schema.cue dashboard.json".
func (s *dashboardSchema) validate(file string, data []byte, isJSON bool) error {
	resources, err := decodeResources(s.ctx, file, data, isJSON)
	if err != nil {
		return err
	}
	for _, resource := range resources {
		if kind, _ := resource.LookupPath(cue.ParsePath("kind")).String(); kind != string(modelV1.KindDashboard) {
			continue
		}
		if err := s.definition.Unify(resource).Validate(cue.Concrete(true)); err != nil {
			name, _ := resource.LookupPath(cue.ParsePath("metadata.name")).String()
			return fmt.Errorf("invalid dashboard %q: %w", name, apiCue.FormatErrors(err))
		}
	}
	return nil
}
