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
	"cuelang.org/go/cue/token"

	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1plugin "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/perses/spec/go/dashboard"
	"github.com/sirupsen/logrus"
)

const (
	dashboardDefinitionName = "#Dashboard"
)

var (
	// cue Selectors
	// definitions
	dashboardDefSelector = cue.Def("#Dashboard")
	// hidden
	metadataHidSelector         = cue.Hid("_Metadata_0", "_")
	querySpecHidSelector        = cue.Hid("_QuerySpec_0", "_")
	datasourceSpecHidSelector   = cue.Hid("_Spec_1", "_")
	panelSpecHidSelector        = cue.Hid("_PanelSpec_0", "_")
	variableSpecHidSelector     = cue.Hid("_Variable_0", "_")
	layoutHidSelector           = cue.Hid("_Layout_0", "_")
	projMetadataHidSelector     = cue.Hid("_ProjectMetadata_0", "_")
	projMetadataWrapHidSelector = cue.Hid("_ProjectMetadataWrapper_0", "_")
	listSpecHidSelector         = cue.Hid("_ListSpec_0", "_")
	listVariableSpecSelector    = cue.Hid("_ListVariableSpec_0", "_")
	textSpecHidSelector         = cue.Hid("_TextSpec_0", "_")
	textVariableSpecSelector    = cue.Hid("_TextVariableSpec_0", "_")
	// string
	pluginSelector = cue.Str("plugin")
	specSelector   = cue.Str("spec")
)

var cueValidationOptions = []cue.Option{
	cue.InlineImports(true),
	cue.Attributes(true),
	cue.Definitions(true),
	cue.Hidden(false),
}

// Helper function designed specifically to remove the "": _Metadata_0 & _ProjectMetadataWrapper_0 field from _ProjectMetadata_0
// this is a workaround to mitigate issues with cue vet
func removeEmptyStringField(ctx *cue.Context, val cue.Value) (cue.Value, error) {
	// get the ast.Node
	node := val.Syntax()

	// walk the dashboard ast.Node and prepare a new list of fields newDecls
	ast.Walk(node, func(n ast.Node) bool {
		if st, ok := n.(*ast.StructLit); ok {
			var newDecls []ast.Decl
			for _, decl := range st.Elts {
				if f, ok := decl.(*ast.Field); ok {
					// identify the empty string label and skip it
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

	// build the new value
	expr, err := utils.ASTNodeToASTExpr(node)
	if err != nil {
		return cue.Value{}, fmt.Errorf("unexpected AST node type %T: %w", node, err)
	}
	return ctx.BuildExpr(expr), nil
}

func renameDefinition(ctx *cue.Context, value cue.Value, oldName, newName string) cue.Value {
	node := value.Syntax(utils.CueSyntaxOptions...)

	ast.Walk(node, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.Ident:
			if x.Name == oldName {
				x.Name = newName
			}
		}
		return true
	}, nil)

	expr, err := utils.ASTNodeToASTExpr(node)
	if err != nil {
		logrus.WithError(err).Error("unable to rename CUE definition")
		return value
	}
	return ctx.BuildExpr(expr)

}

func dashboardToCue(ctx *cue.Context) (cue.Value, error) {
	// load dashboard
	encoded := ctx.EncodeType(v1.Dashboard{})
	if encoded.Err() != nil {
		return cue.Value{}, fmt.Errorf("encoding %s: %w", dashboardDefinitionName, encoded.Err())
	}

	expr, err := utils.CUEValueToASTExpr(encoded)
	if err != nil {
		return cue.Value{}, fmt.Errorf("could not cast CUE value to AST expr: %w", err)
	}

	// only doing this so that the entire CUE will be wrapped in a #Dashboard definition
	decls := &ast.Field{
		Label: ast.NewIdent(dashboardDefinitionName),
		Value: expr,
	}

	final := ctx.BuildExpr(&ast.StructLit{Elts: []ast.Decl{decls}})
	if final.Err() != nil {
		return cue.Value{}, fmt.Errorf("building schema value: %w", final.Err())
	}

	final, err = removeEmptyStringField(ctx, final)
	if err != nil {
		return cue.Value{}, fmt.Errorf("failed to remove empty fields from dashboard schema: %w", err)
	}

	// grab _Metadata_0 and _ProjectMetadataWrapper_0 from #Dashboard
	metadata := final.LookupPath(cue.MakePath(dashboardDefSelector, metadataHidSelector))
	if metadata.Err() != nil {
		return cue.Value{}, fmt.Errorf("could not lookup Metadata schema: %w", metadata.Err())
	}
	projMetadataWrapper := final.LookupPath(cue.MakePath(dashboardDefSelector, projMetadataWrapHidSelector))
	if projMetadataWrapper.Err() != nil {
		return cue.Value{}, fmt.Errorf("could not lookup ProjectMetadataWrapper schema: %w", projMetadataWrapper.Err())
	}

	// injecting the _Metadata_0 and _ProjectMetadataWrapper_0 directly into _ProjectMetadata_0
	// this is done to avoid the inline union issue during `cue vet`
	final = final.FillPath(cue.MakePath(dashboardDefSelector, projMetadataHidSelector), metadata)
	final = final.FillPath(cue.MakePath(dashboardDefSelector, projMetadataHidSelector), projMetadataWrapper)

	// fill the missing LayoutSpec
	// for now the only option is GridLayoutSpec
	gridLayoutSpec := ctx.EncodeType(dashboard.GridLayoutSpec{})
	final = final.FillPath(cue.MakePath(dashboardDefSelector, layoutHidSelector, specSelector), gridLayoutSpec)

	if validateErr := final.Validate(cueValidationOptions...); validateErr != nil {
		// retrieve the full error detail to provide better insights to the end user:
		ex, errOs := os.Executable()
		if errOs != nil {
			logrus.WithError(errOs).Error("Error retrieving exec path to build CUE error detail")
		}
		fullErrStr := errors.Details(validateErr, &errors.Config{Cwd: filepath.Dir(ex)})
		logrus.Debug(fullErrStr)

		return cue.Value{}, fmt.Errorf("failed to validate dashboard schema: %s", fullErrStr)
	}
	return final, nil
}

func GenerateDashboardCueValue(ctx *cue.Context, plugins map[v1plugin.Kind]cue.Value) (cue.Value, error) {
	dashSpec, err := dashboardToCue(ctx)
	if err != nil {
		return cue.Value{}, fmt.Errorf("unable to load dashboard schema: %w", err)
	}

	result := dashSpec

	// unify with panel plugins
	if panels, ok := plugins[v1plugin.KindPanel]; ok {
		result = result.FillPath(cue.MakePath(dashboardDefSelector, panelSpecHidSelector, pluginSelector), panels)
	}

	// unify with datasource plugins
	if datasources, ok := plugins[v1plugin.KindDatasource]; ok {
		result = result.FillPath(cue.MakePath(dashboardDefSelector, datasourceSpecHidSelector, pluginSelector), datasources)
	}

	// unify with query plugins
	if queries, ok := plugins[v1plugin.KindQuery]; ok {
		result = result.FillPath(cue.MakePath(dashboardDefSelector, querySpecHidSelector, pluginSelector), queries)
	}

	if variables, ok := plugins[v1plugin.KindVariable]; ok {
		// load TextVariableSpec and ListVariableSpec
		textVarSpec := ctx.EncodeType(dashboard.TextVariableSpec{})
		if textVarSpec.Err() != nil {
			return cue.Value{}, fmt.Errorf("could not encode TextVariableSpec: %w", textVarSpec.Err())
		}

		// rename _Display_0 to _Display_TextSpec_0 to avoid name collision
		// resulting in the `incomplete value` during cue vet
		textVarSpec = renameDefinition(ctx, textVarSpec, "_Display_0", "_Display_TextSpec_0")

		listVarSpec := ctx.EncodeType(dashboard.ListVariableSpec{})
		if listVarSpec.Err() != nil {
			return cue.Value{}, fmt.Errorf("could not encode ListVariableSpec: %w", listVarSpec.Err())
		}

		// rename _Display_0 to _Display_ListSpec_0 to avoid name collision
		// resulting in the `incomplete value` during cue vet
		listVarSpec = renameDefinition(ctx, listVarSpec, "_Display_0", "_Display_ListSpec_0")

		// grab _ListSpec_0 and inject it into _ListVariableSpec_0
		// this is done to avoid the incomplete value error during cue vet
		// cue vet has trouble working with embedded fields
		listSpec := listVarSpec.LookupPath(cue.MakePath(listSpecHidSelector))
		if listSpec.Err() != nil {
			return cue.Value{}, fmt.Errorf("could not lookup ListSpec schema: %w", listSpec.Err())
		}

		listVarSpec = listVarSpec.FillPath(cue.MakePath(listVariableSpecSelector), listSpec)
		listVarSpec, err = removeEmptyStringField(ctx, listVarSpec)
		if err != nil {
			return cue.Value{}, fmt.Errorf("failed to remove empty fields from ListVariable schema: %w", err)
		}

		// grab _TextSpec_0 and inject it into _TextVariableSpec_0
		// this is done to avoid the incomplete value error during cue vet
		// cue vet has trouble working with embedded fields
		textSpec := textVarSpec.LookupPath(cue.MakePath(textSpecHidSelector))
		if textSpec.Err() != nil {
			return cue.Value{}, fmt.Errorf("could not lookup TextSpec schema: %w", textSpec.Err())
		}

		textVarSpec = textVarSpec.FillPath(cue.MakePath(textVariableSpecSelector), textSpec)
		textVarSpec, err = removeEmptyStringField(ctx, textVarSpec)
		if err != nil {
			return cue.Value{}, fmt.Errorf("failed to remove empty fields from TextVariable schema: %w", err)
		}

		// plugins only present in ListVariable
		listVarSpec = listVarSpec.FillPath(cue.MakePath(listVariableSpecSelector, pluginSelector), variables)

		textVarSpecExpr, err := utils.CUEValueToASTExpr(textVarSpec)
		if err != nil {
			return cue.Value{}, fmt.Errorf("could not process text variable spec schema: %w", err)
		}
		listVarSpecExpr, err := utils.CUEValueToASTExpr(listVarSpec)
		if err != nil {
			return cue.Value{}, fmt.Errorf("could not process list variable spec schema: %w", err)
		}

		completeVarSpecExpr := &ast.BinaryExpr{
			Op: token.OR,
			X:  textVarSpecExpr,
			Y:  listVarSpecExpr,
		}

		completeVarSpecValue := ctx.BuildExpr(completeVarSpecExpr)

		// unify the variable spec with the dashboard schema
		result = result.FillPath(cue.MakePath(dashboardDefSelector, variableSpecHidSelector, specSelector), completeVarSpecValue)
	}

	return result, nil
}
