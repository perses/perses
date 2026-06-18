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

package cue

import (
	"fmt"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/ast/astutil"
	"cuelang.org/go/cue/format"
)

var CueSyntaxOptions = []cue.Option{
	cue.InlineImports(true),
	cue.All(),
	cue.Hidden(false),
}

// Helper function to cast ast.Node into ast.Expr
// Needed because ast.Node does not have to strictly implement ast.Expr interface
func ASTNodeToASTExpr(node ast.Node) (ast.Expr, error) {
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
		return tmpExpr, fmt.Errorf("unexpected ast.Node type %T", node)
	}
	return tmpExpr, nil
}

func CUEValueToASTExpr(v cue.Value) (ast.Expr, error) {
	node := v.Syntax(
		cue.InlineImports(true),
		cue.All(),
		cue.Definitions(true),
	)

	expr, err := ASTNodeToASTExpr(node)
	if err != nil {
		return nil, fmt.Errorf("could not cast AST node to AST expr: %w", err)
	}
	return expr, nil
}

func MarshalCUE(v cue.Value) ([]byte, error) {
	// generate expr
	node := v.Syntax(CueSyntaxOptions...)

	// postprocess node to remove comments that break the file
	postprocessSchemaASTNode(node)
	// format CUE expr
	data, err := format.Node(node, format.Simplify())
	if err != nil {
		return nil, fmt.Errorf("could not format CUE value: %w", err)
	}
	return data, nil
}

func postprocessSchemaASTNode(n ast.Node) {
	astutil.Apply(n, removeExplicitErrorComments, nil)
}

// removes the "// explicit error (_|_ literal) in source" along with any new lines / whitespaces left after the cleanup
func removeExplicitErrorComments(c astutil.Cursor) bool {
	node := c.Node()
	groups := ast.Comments(node)
	filtered := groups[:0]
	for _, cg := range groups {
		newList := cg.List[:0]
		for _, c := range cg.List {
			if c.Text != "// explicit error (_|_ literal) in source" {
				newList = append(newList, c)
			}
		}
		cg.List = newList
		// Only keep the group if it still has comments
		if len(cg.List) > 0 {
			filtered = append(filtered, cg)
		}
	}
	ast.SetComments(node, filtered)
	return true
}
