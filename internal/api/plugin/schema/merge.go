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
	"slices"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/token"
	apiCue "github.com/perses/perses/internal/api/cue"
	specPlugin "github.com/perses/spec/go/plugin"
	"github.com/sirupsen/logrus"
)

// PluginSchemas is the CUE AST of the plugin schemas of a kind, as embedded in the dashboard schema.
type PluginSchemas struct {
	// Definitions holds one top-level definition per plugin (e.g. `#Plugin_Panel_TimeSeriesChart: {...}`).
	Definitions []ast.Decl
	// Disjunction is the OR join of the plugins. Its branches reference the regular fields of the definitions
	// (e.g. `{kind: #Plugin_Panel_TimeSeriesChart.kind, spec: #Plugin_Panel_TimeSeriesChart.spec}`), so the
	// definitions must be declared at the root of the value the disjunction is filled into.
	Disjunction ast.Expr
}

// GenerateSchemaDisjunction generates the definitions of a list of LoadSchemas and a disjunction (OR join)
// referencing them.
func GenerateSchemaDisjunction(ctx *cue.Context, schemas []LoadSchema) (PluginSchemas, error) {
	var result PluginSchemas
	var expr []ast.Expr
	usedNames := map[string]struct{}{}

	// sorting the slice so that the plugin order is not random
	slices.SortFunc(schemas, func(a, b LoadSchema) int {
		return strings.Compare(a.Name, b.Name)
	})

	for _, ls := range schemas {
		// build instance for all schemas
		inst := ctx.BuildInstance(ls.Instance, cue.InferBuiltins(true))
		if inst.Err() != nil {
			return PluginSchemas{}, fmt.Errorf("error while building instance %s: %w", ls.Name, inst.Err())
		}

		castExpr, err := apiCue.ValueToASTExpr(inst)
		if err != nil {
			return PluginSchemas{}, fmt.Errorf("could not process %s plugin schema: %w", ls.Name, err)
		}
		defName := pluginDefinitionName(ls.Kind, ls.Name)
		// names that only differ by a character replaced in the definition name must not be merged into the same definition
		for i := 2; ; i++ {
			if _, used := usedNames[defName]; !used {
				break
			}
			defName = fmt.Sprintf("%s_%d", pluginDefinitionName(ls.Kind, ls.Name), i)
		}
		usedNames[defName] = struct{}{}
		branch, ok := referencePluginFields(castExpr, defName)
		if !ok {
			logrus.Debugf("plugin %s (%s): schema can't be referenced from a definition, it is embedded as-is in the dashboard schema", ls.Name, ls.Kind)
			expr = append(expr, castExpr)
			continue
		}
		result.Definitions = append(result.Definitions, &ast.Field{Label: ast.NewIdent(defName), Value: castExpr})
		expr = append(expr, branch)
	}

	if len(expr) == 0 {
		return PluginSchemas{}, errors.New("no plugin schemas returned")
	}

	// OR join all expressions
	// start with the first expr, and OR join all the next ones'
	result.Disjunction = expr[0]
	for _, e := range expr[1:] {
		result.Disjunction = &ast.BinaryExpr{
			Op: token.OR,
			X:  result.Disjunction,
			Y:  e,
		}
	}
	return result, nil
}

// pluginDefinitionName returns the name of the top-level definition of a plugin, e.g. #Plugin_Panel_TimeSeriesChart.
func pluginDefinitionName(kind specPlugin.Kind, name string) string {
	sanitize := func(s string) string {
		return strings.Map(func(r rune) rune {
			if r == '_' || ('a' <= r && r <= 'z') || ('A' <= r && r <= 'Z') || ('0' <= r && r <= '9') {
				return r
			}
			return '_'
		}, s)
	}
	return fmt.Sprintf("#Plugin_%s_%s", sanitize(string(kind)), sanitize(name))
}

// referencePluginFields returns a disjunction branch that references the regular fields of the plugin definition
// defName (e.g. `{kind: #Plugin_Panel_X.kind, spec: #Plugin_Panel_X.spec}`) instead of embedding the plugin schema.
// This keeps the plugin's own definitions (e.g. #palette) out of the disjunction, where `cue vet -c` rejects
// definitions that can't be resolved without data.
// It returns false, meaning the schema must be embedded as-is, when a top-level field is optional/required or is
// referenced from within the plugin (such references would point to the definition, not to the dashboard data).
func referencePluginFields(expr ast.Expr, defName string) (ast.Expr, bool) {
	st, ok := expr.(*ast.StructLit)
	if !ok {
		return nil, false
	}
	var fields []ast.Decl
	regularNames := map[string]struct{}{}
	for _, decl := range st.Elts {
		switch d := decl.(type) {
		case *ast.Field:
			name, isIdent, err := ast.LabelName(d.Label)
			if err != nil || !isIdent {
				return nil, false
			}
			if strings.HasPrefix(name, "#") || strings.HasPrefix(name, "_") {
				// definitions and hidden fields stay in the plugin definition
				continue
			}
			if d.Constraint != token.ILLEGAL {
				return nil, false
			}
			regularNames[name] = struct{}{}
			fields = append(fields, &ast.Field{
				Label: ast.NewIdent(name),
				Value: ast.NewSel(ast.NewIdent(defName), name),
			})
		case *ast.LetClause, *ast.CommentGroup, *ast.Attribute:
			// only reachable from within the plugin definition
		default:
			return nil, false
		}
	}
	if len(fields) == 0 {
		return nil, false
	}
	for _, decl := range st.Elts {
		if referencesAny(decl, regularNames) {
			return nil, false
		}
	}
	return &ast.StructLit{Elts: fields}, true
}

// referencesAny returns whether the node contains an identifier named after one of the given names, other than a
// field label or a selector. It can report references that resolve to another field of the same name, which is fine
// for its conservative use.
func referencesAny(node ast.Node, names map[string]struct{}) bool {
	found := false
	ast.Walk(node, func(n ast.Node) bool {
		if found {
			return false
		}
		switch x := n.(type) {
		case *ast.Field:
			switch x.Label.(type) {
			case *ast.Ident, *ast.BasicLit:
			default:
				found = referencesAny(x.Label, names)
			}
			if !found && x.Value != nil {
				found = referencesAny(x.Value, names)
			}
			return false
		case *ast.SelectorExpr:
			found = referencesAny(x.X, names)
			return false
		case *ast.Ident:
			_, found = names[x.Name]
		}
		return true
	}, nil)
	return found
}

// Generates a single cue.Value composed of a list of cue definitions (prefixed by #)
func GenerateSchemaDefinitions(ctx *cue.Context, schemas []LoadSchema) (cue.Value, error) {
	// sorting the slice so that the plugin order is not random
	slices.SortFunc(schemas, func(a, b LoadSchema) int {
		return strings.Compare(a.Name, b.Name)
	})

	result := ctx.CompileString("{}")
	for _, ls := range schemas {
		value := ctx.BuildInstance(ls.Instance, cue.InferBuiltins(true))
		if value.Err() != nil {
			return cue.Value{}, fmt.Errorf("unable to build instance %s: %w", ls.Name, value.Err())
		}
		defPath := cue.MakePath(cue.Def(fmt.Sprintf("#%s", ls.Name)))
		result = result.FillPath(defPath, value)
	}
	if result.Err() != nil {
		return cue.Value{}, fmt.Errorf("building schema value: %w", result.Err())
	}
	return result, nil
}
