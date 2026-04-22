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
	"os"
	"path/filepath"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/load"
	"cuelang.org/go/cue/token"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1plugin "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/sirupsen/logrus"
)

const dashboardPkg = "github.com/perses/perses/cue/model/api/v1"
const dashboardDefinitionName = "#Dashboard"

var cueSyntaxOptions = []cue.Option{
	cue.InlineImports(true),
	cue.All(),
}

var cueValidationOptions = []cue.Option{
	cue.InlineImports(true),
	cue.Attributes(true),
	cue.Definitions(true),
	cue.Hidden(true),
}

func LoadFromSpec(ctx *cue.Context) (cue.Value, error) {
	encoded := ctx.EncodeType(v1.Dashboard{})
	if encoded.Err() != nil {
		return cue.Value{}, fmt.Errorf("encoding %s: %w", dashboardDefinitionName, encoded.Err())
	}
	node := encoded.Syntax(cueSyntaxOptions...)
	expr, ok := node.(ast.Expr)
	if !ok {
		return cue.Value{}, fmt.Errorf("unexpected AST node type %T for %s", node, dashboardDefinitionName)
	}

	decls := &ast.Field{
		Label: ast.NewIdent(dashboardDefinitionName),
		Value: expr,
	}

	final := ctx.BuildExpr(&ast.StructLit{Elts: []ast.Decl{decls}})
	if final.Err() != nil {
		return cue.Value{}, fmt.Errorf("building schema value: %w", final.Err())
	}
	if validateErr := final.Validate(cueValidationOptions...); validateErr != nil {
		// retrieve the full error detail to provide better insights to the end user:
		ex, errOs := os.Executable()
		if errOs != nil {
			logrus.WithError(errOs).Error("Error retrieving exec path to build CUE error detail")
		}
		fullErrStr := errors.Details(validateErr, &errors.Config{Cwd: filepath.Dir(ex)})
		logrus.Debug(fullErrStr)

		return cue.Value{}, fmt.Errorf("failed to validate dashboard schema: %w", fullErrStr)
	}
	return final, nil
}

// Load loads the full github.com/perses/perses/cue/model/api/v1 package value.
// schemasPath must be the CUE module root of the perses repo (the directory containing cue.mod/).
func Load(ctx *cue.Context, schemasPath string) (cue.Value, error) {
	instances := load.Instances([]string{dashboardPkg}, &load.Config{
		Dir: schemasPath,
	})
	if len(instances) != 1 {
		return cue.Value{}, fmt.Errorf("expected 1 build instance for %s, got %d", dashboardPkg, len(instances))
	}
	inst := instances[0]
	if inst.Err != nil {
		return cue.Value{}, fmt.Errorf("failed to load %s: %w", dashboardPkg, inst.Err)
	}

	v := ctx.BuildInstance(inst)
	if v.Err() != nil {
		return cue.Value{}, fmt.Errorf("failed to build %s: %w", dashboardPkg, v.Err())
	}
	return v, nil
}

func MergeWithPlugins(ctx *cue.Context, dashSpec cue.Value, plugins map[v1plugin.Kind]cue.Value) (cue.Value, error) {
	result := dashSpec

	// #Dashboard: spec: panels: {[_]: spec: plugin: spec: <panels>}
	if panels, ok := plugins[v1plugin.KindPanel]; ok {
		overlay, err := buildOverlay(ctx, panels, func(inner ast.Expr) ast.Expr {
			return structLit(
				fieldExpr("#Dashboard", structLit(
					fieldExpr("spec", structConstraint(
						"panels", structWildcard(structLit(
							fieldExpr("spec", structLit(
								fieldExpr("plugin", inner),
							)),
						)),
					)),
				)),
			)
		})
		if err != nil {
			return cue.Value{}, fmt.Errorf("building panel overlay: %w", err)
		}
		result = result.Unify(overlay)
		if result.Err() != nil {
			return cue.Value{}, fmt.Errorf("unifying panel schemas: %w", result.Err())
		}
	}

	// #Dashboard: spec: panels: {[_]: spec: queries: [...{spec: plugin: spec: <queryDisj>}]}
	// #Dashboard: spec: panels: {[_]: spec: queries: [...{spec: plugin: spec: <queries>}]}
	if queries, ok := plugins[v1plugin.KindQuery]; ok {
		overlay, err := buildOverlay(ctx, queries, func(inner ast.Expr) ast.Expr {
			return structLit(
				fieldExpr("#Dashboard", structLit(
					fieldExpr("spec", structConstraint(
						"panels", structWildcard(structLit(
							fieldExpr("spec", structLit(
								fieldExpr("queries",
									listEllipsis(structLit(
										fieldExpr("spec", structLit(
											fieldExpr("plugin", inner),
										)),
									)),
								),
							)),
						)),
					)),
				)),
			)
		})
		if err != nil {
			return cue.Value{}, fmt.Errorf("building query overlay: %w", err)
		}
		result = result.Unify(overlay)
		if result.Err() != nil {
			return cue.Value{}, fmt.Errorf("unifying query schemas: %w", result.Err())
		}
	}

	// #Dashboard: spec: datasources: {[_]: spec: <datasources>}
	if datasources, ok := plugins[v1plugin.KindDatasource]; ok {
		overlay, err := buildOverlay(ctx, datasources, func(inner ast.Expr) ast.Expr {
			return structLit(
				fieldExpr("#Dashboard", structLit(
					fieldExpr("spec", structConstraint(
						"datasources", structWildcard(structLit(
							fieldExpr("spec", inner),
						)),
					)),
				)),
			)
		})
		if err != nil {
			return cue.Value{}, fmt.Errorf("building datasource overlay: %w", err)
		}
		result = result.Unify(overlay)
		if result.Err() != nil {
			return cue.Value{}, fmt.Errorf("unifying datasource schemas: %w", result.Err())
		}
	}

	// #Dashboard: spec: variables: [...{spec: plugin?: spec: <variableDisj>}]
	// plugin is optional: TextVariable has no plugin field
	if variables, ok := plugins[v1plugin.KindVariable]; ok {
		overlay, err := buildOverlay(ctx, variables, func(inner ast.Expr) ast.Expr {
			return structLit(
				fieldExpr("#Dashboard", structLit(
					fieldExpr("spec", structLit(
						fieldExpr("variables",
							listEllipsis(structLit(
								fieldExpr("spec", structLit(
									optionalFieldExpr("plugin", inner),
								)),
							)),
						),
					)),
				)),
			)
		})
		if err != nil {
			return cue.Value{}, fmt.Errorf("building variable overlay: %w", err)
		}
		result = result.Unify(overlay)
		if result.Err() != nil {
			return cue.Value{}, fmt.Errorf("unifying variable schemas: %w", result.Err())
		}
	}

	return result, nil
}

// buildOverlay extracts the AST expression from a merged plugin cue.Value, wraps it
// using the provided layout function, and builds it into a cue.Value for unification.
func buildOverlay(ctx *cue.Context, v cue.Value, layout func(ast.Expr) ast.Expr) (cue.Value, error) {
	node := v.Syntax(
		cue.InlineImports(true),
		cue.All(),
		cue.Definitions(true),
	)

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
		return cue.Value{}, fmt.Errorf("unexpected AST node type %T", node)
	}

	wrapped := ctx.BuildExpr(layout(tmpExpr))
	if wrapped.Err() != nil {
		return cue.Value{}, wrapped.Err()
	}
	return wrapped, nil
}

// structConstraint builds: {[_]: <value>} as a field named <name>.
// i.e.  name: {[_]: value}
func structConstraint(name string, value ast.Expr) ast.Expr {
	return structLit(fieldExpr(name, value))
}

// structWildcard builds: {[_]: <value>}
func structWildcard(value ast.Expr) ast.Expr {
	return &ast.StructLit{
		Elts: []ast.Decl{
			&ast.Field{
				Label: &ast.ListLit{Elts: []ast.Expr{ast.NewIdent("_")}},
				Value: value,
			},
		},
	}
}

// listEllipsis builds: [...<elem>]
func listEllipsis(elem ast.Expr) ast.Expr {
	return &ast.ListLit{
		Elts: []ast.Expr{
			&ast.Ellipsis{Type: elem},
		},
	}
}

// structLit wraps declarations into a struct literal.
func structLit(decls ...ast.Decl) ast.Expr {
	return &ast.StructLit{Elts: decls}
}

// fieldExpr builds a regular field: <name>: <value>
func fieldExpr(name string, value ast.Expr) ast.Decl {
	return &ast.Field{
		Label: ast.NewIdent(name),
		Value: value,
	}
}

// optionalFieldExpr builds an optional field: <name>?: <value>
func optionalFieldExpr(name string, value ast.Expr) ast.Decl {
	return &ast.Field{
		Label:      ast.NewIdent(name),
		Constraint: token.OPTION,
		Value:      value,
	}
}
