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
)

func MergeSchemas(ctx *cue.Context, schemas []LoadSchema) (cue.Value, error) {
	var expr []ast.Expr

	for _, ls := range schemas {
		// build instance for all schemas
		inst := ctx.BuildInstance(ls.Instance, cue.InferBuiltins(true))
		if inst.Err() != nil {
			return cue.Value{}, fmt.Errorf("error while building instance %s: %w", ls.Name, inst.Err())
		}
		// cast all schemas to ast.Expr or ast.File
		node := inst.Syntax(
			cue.InlineImports(true),
			cue.All(),
			cue.Definitions(true),
		)

		// casting into ast.Expr
		// cannot simply use node.(ast.Expr) as it can fail for plugins with package declarations and/or import statements in their schema
		// in such cases inst.Syntax() returns *ast.File that is not directly castable into ast.Expr
		var tmpExpr ast.Expr
		switch n := node.(type) {
		case ast.Expr:
			tmpExpr = n
		// handling *ast.File
		case *ast.File:
			var elts []ast.Decl
			for _, declr := range n.Decls {
				switch declr.(type) {
				case *ast.Package, *ast.ImportDecl:
					continue
				default:
					elts = append(elts, declr)
				}
			}
			tmpExpr = &ast.StructLit{Elts: elts}
		default:
			// TODO: return with just an empty cue.Value, or just skip the failing plugin?
			return cue.Value{}, fmt.Errorf("unexpected ast.Node type %T for schema %s", node, ls.Name)
		}
		expr = append(expr, tmpExpr)
	}
	// OR join all expressions
	// start with the first expr, and OR join all the next ones'
	if len(expr) > 0 {
		complete := expr[0]
		for _, e := range expr[1:] {
			complete = &ast.BinaryExpr{
				Op: token.OR,
				X:  complete,
				Y:  e,
			}
		}
		// build the final expression value
		value := ctx.BuildExpr(complete)
		if value.Err() != nil {
			return cue.Value{}, fmt.Errorf("unable to merge schemas: %w", value.Err())
		}
		return value, nil
	}
	return cue.Value{}, errors.New("no plugin schemas returned")
}
