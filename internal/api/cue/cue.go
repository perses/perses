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
	"github.com/sirupsen/logrus"
)

var CueSyntaxOptions = []cue.Option{
	cue.InlineImports(true),
	cue.All(),
	cue.Hidden(false),
}

// Helper function to cast ast.Node into ast.Expr
// Needed because ast.Node does not have to strictly implement ast.Expr interface
func astNodeToAstExpr(node ast.Node) (ast.Expr, error) {
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

	expr, err := astNodeToAstExpr(node)
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

// RemoveEmptyStringField removes any struct field whose label is the empty string literal "".
// This is a workaround to mitigate issues with cue vet.
func RemoveEmptyStringField(ctx *cue.Context, val cue.Value) (cue.Value, error) {
	node := val.Syntax()

	ast.Walk(node, func(n ast.Node) bool {
		if st, ok := n.(*ast.StructLit); ok {
			var newDecls []ast.Decl
			for _, decl := range st.Elts {
				if f, ok := decl.(*ast.Field); ok {
					if lit, ok := f.Label.(*ast.BasicLit); ok && lit.Value == `""` {
						continue
					}
				}
				newDecls = append(newDecls, decl)
			}
			st.Elts = newDecls
		}
		return true
	}, nil)

	expr, err := astNodeToAstExpr(node)
	if err != nil {
		return cue.Value{}, fmt.Errorf("unexpected AST node type %T: %w", node, err)
	}
	return ctx.BuildExpr(expr), nil
}

// RenameDefinition renames all AST identifiers matching oldName to newName within value.
func RenameDefinition(ctx *cue.Context, value cue.Value, oldName, newName string) cue.Value {
	node := value.Syntax(CueSyntaxOptions...)

	ast.Walk(node, func(n ast.Node) bool {
		if x, ok := n.(*ast.Ident); ok && x.Name == oldName {
			x.Name = newName
		}
		return true
	}, nil)

	expr, err := astNodeToAstExpr(node)
	if err != nil {
		logrus.WithError(err).Error("unable to rename CUE definition")
		return value
	}
	return ctx.BuildExpr(expr)
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
