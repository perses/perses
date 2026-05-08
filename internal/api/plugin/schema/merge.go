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

package schema

import (
	"errors"
	"fmt"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/token"
	"github.com/perses/perses/internal/api/utils"
)

const (
	definitionPrefix = "#"
)

// Function generates a disjunction (OR join) of a list of LoadSchemas
// and returns it in a single cue.Value
func GenerateSchemaDisjunction(ctx *cue.Context, schemas []LoadSchema) (cue.Value, error) {
	var expr []ast.Expr

	for _, ls := range schemas {
		// build instance for all schemas
		inst := ctx.BuildInstance(ls.Instance, cue.InferBuiltins(true))
		if inst.Err() != nil {
			return cue.Value{}, fmt.Errorf("error while building instance %s: %w", ls.Name, inst.Err())
		}

		node := inst.Syntax(
			cue.InlineImports(true),
			cue.All(),
			cue.Definitions(true),
		)

		castExpr, err := utils.CastASTNodeToASTExpr(node)
		if err != nil {
			return cue.Value{}, fmt.Errorf("could not process %s plugin schema: %w", ls.Name, err)
		}
		expr = append(expr, castExpr)
	}

	if len(expr) == 0 {
		return cue.Value{}, errors.New("no plugin schemas returned")
	}

	// OR join all expressions
	// start with the first expr, and OR join all the next ones'
	complete := expr[0]
	if len(expr) > 1 {
		for _, e := range expr[1:] {
			complete = &ast.BinaryExpr{
				Op: token.OR,
				X:  complete,
				Y:  e,
			}
		}
	}
	// build the final expression value
	value := ctx.BuildExpr(complete)
	if value.Err() != nil {
		return cue.Value{}, fmt.Errorf("unable to merge schemas: %w", value.Err())
	}
	return value, nil
}

func GenerateSchemaDefinitions(ctx *cue.Context, schemas []LoadSchema) (cue.Value, error) {
	definitions := make(map[string]cue.Value)
	for _, ls := range schemas {
		value := ctx.BuildInstance(ls.Instance)
		if value.Err() != nil {
			return cue.Value{}, fmt.Errorf("unable to build instance %s: %w", ls.Name, value.Err())
		}
		definitions[ls.Name] = value
	}

	var declsList []ast.Decl
	for name, value := range definitions {
		expr, err := utils.CastASTNodeToASTExpr(value.Syntax(utils.CueSyntaxOptions...))
		if err != nil {
			return cue.Value{}, err
		}
		decls := &ast.Field{
			Label: ast.NewIdent(fmt.Sprintf("%s%s", definitionPrefix, name)),
			Value: expr,
		}
		declsList = append(declsList, decls)
	}
	final := ctx.BuildExpr(&ast.StructLit{Elts: declsList})
	if final.Err() != nil {
		return cue.Value{}, fmt.Errorf("building schema value: %w", final.Err())
	}
	return final, nil
}

func Placeholder(ctx *cue.Context, ls LoadSchema) cue.Value { return cue.Value{} }
