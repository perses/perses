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
	projMetadataHidSelector     = cue.Hid("_ProjectMetadata_0", "_")
	projMetadataWrapHidSelector = cue.Hid("_ProjectMetadataWrapper_0", "_")
	listSpecHidSelector         = cue.Hid("_ListSpec_0", "_")
	// string
	specSelector   = cue.Str("spec")
	pluginSelector = cue.Str("plugin")
)

var cueValidationOptions = []cue.Option{
	cue.InlineImports(true),
	cue.Attributes(true),
	cue.Definitions(true),
	cue.Hidden(false),
}

func Load(ctx *cue.Context) (cue.Value, error) {
	// load dashboard
	encoded := ctx.EncodeType(v1.Dashboard{})
	if encoded.Err() != nil {
		return cue.Value{}, fmt.Errorf("encoding %s: %w", dashboardDefinitionName, encoded.Err())
	}
	node := encoded.Syntax(utils.CueSyntaxOptions...)
	expr, err := utils.CastASTNodeToASTExpr(node)
	if err != nil {
		return cue.Value{}, fmt.Errorf("unexpected AST node type %T for %s: %w", node, dashboardDefinitionName, err)
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

func MergeWithPlugins(ctx *cue.Context, dashSpec cue.Value, plugins map[v1plugin.Kind]cue.Value) (cue.Value, error) {
	result := dashSpec

	// grab _Metadata_0 and _ProjectMetadataWrapper_0 from #Dashboard
	metadata := dashSpec.LookupPath(cue.MakePath(dashboardDefSelector, metadataHidSelector))
	if metadata.Err() != nil {
		return cue.Value{}, fmt.Errorf("could not lookup Metadata schema: %w", metadata.Err())
	}
	projMetadataWrapper := dashSpec.LookupPath(cue.MakePath(dashboardDefSelector, projMetadataWrapHidSelector))
	if projMetadataWrapper.Err() != nil {
		return cue.Value{}, fmt.Errorf("could not lookup ProjectMetadataWrapper schema: %w", projMetadataWrapper.Err())
	}

	// injecting the _Metadata_0 and _ProjectMetadataWrapper_0 directly into _ProjectMetadata_0
	// this is done to avoid the inline union issue during `cue vet`
	result = result.FillPath(cue.MakePath(dashboardDefSelector, projMetadataHidSelector), metadata)
	result = result.FillPath(cue.MakePath(dashboardDefSelector, projMetadataHidSelector), projMetadataWrapper)

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
		textSpec := ctx.EncodeType(dashboard.TextVariableSpec{})
		if textSpec.Err() != nil {
			return cue.Value{}, fmt.Errorf("could not encode TextVariableSpec: %w", textSpec.Err())
		}
		listSpec := ctx.EncodeType(dashboard.ListVariableSpec{})
		if listSpec.Err() != nil {
			return cue.Value{}, fmt.Errorf("could not encode ListVariableSpec: %w", listSpec.Err())
		}

		// plugins only present in ListVariable
		listSpec = listSpec.FillPath(cue.MakePath(listSpecHidSelector, specSelector), variables)

		// OR join variable type specs
		var variableSpec []ast.Expr
		for _, value := range []cue.Value{textSpec, listSpec} {
			node := value.Syntax(
				cue.InlineImports(true),
				cue.All(),
				cue.Definitions(true),
			)

			castExpr, err := utils.CastASTNodeToASTExpr(node)
			if err != nil {
				return cue.Value{}, fmt.Errorf("could not process variable spec schema: %w", err)
			}
			variableSpec = append(variableSpec, castExpr)
		}

		if len(variableSpec) != 2 {
			return cue.Value{}, fmt.Errorf("invalid number of variable spec schemas, expected 2, got %d", len(variableSpec))
		}

		completeVarSpecExpr := &ast.BinaryExpr{
			Op: token.OR,
			X:  variableSpec[0],
			Y:  variableSpec[1],
		}

		completeVarSpecValue := ctx.BuildExpr(completeVarSpecExpr)

		// unify the variable spec with the dashboard schema
		result = result.FillPath(cue.MakePath(dashboardDefSelector, variableSpecHidSelector), completeVarSpecValue)
	}

	return result, nil
}
