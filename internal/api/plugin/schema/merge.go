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
	"fmt"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/token"
)

func MergeSchemas(ctx *cue.Context, schemas []LoadSchema) (cue.Value, error) {
	var expr []ast.Expr

	for _, ls := range schemas {
		// build instance for all schemas
		inst := ctx.BuildInstance(ls.Instance)
		if inst.Err() != nil {
			return cue.Value{}, fmt.Errorf("error while building instance %s: %w", ls.Name, inst.Err())
		}
		// 2. v.Syntax(cue.All(), cue.Definitions(true)) to get ast.Expr per value
		node := inst.Syntax(
			cue.Docs(true),
			cue.All(),
			cue.Definitions(true),
		)
		if e, ok := node.(ast.Expr); ok {
			expr = append(expr, e)
		} // warning if cast fails?
	}
	// 3. OR join all expressions
	complete := expr[0]
	for _, e := range expr[1:] {
		complete = &ast.BinaryExpr{
			Op: token.OR,
			X:  complete,
			Y:  e,
		}
	}
	// 4. build the final expression value
	value := ctx.BuildExpr(complete)
	if value.Err() != nil {
		return cue.Value{}, fmt.Errorf("unable to merge schemas: %w", value.Err())
	}
	return value, nil
}
