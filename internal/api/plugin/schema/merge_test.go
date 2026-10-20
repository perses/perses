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
	"slices"
	"testing"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/format"
	apiCue "github.com/perses/perses/internal/api/cue"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// loadSchemaFromTestdata is a helper that loads a single LoadSchema from a
// testdata directory, reusing the same LoadModelSchema function used in production.
func loadSchemaFromTestdata(t *testing.T, schemaDir string) LoadSchema {
	t.Helper()
	name, instance, err := LoadModelSchema(schemaDir)
	require.NoError(t, err)
	return LoadSchema{Kind: plugin.KindPanel, Name: name, Instance: instance}
}

// buildDisjunction builds the disjunction of plugin schemas with their definitions in scope.
func buildDisjunction(t *testing.T, ctx *cue.Context, plugins PluginSchemas) cue.Value {
	t.Helper()
	elts := append(slices.Clone(plugins.Definitions), &ast.Field{Label: ast.NewIdent("out"), Value: plugins.Disjunction})
	v := ctx.BuildExpr(&ast.StructLit{Elts: elts})
	require.NoError(t, v.Err())
	return v.LookupPath(cue.ParsePath("out"))
}

func TestGenerateSchemaDisjunctionSingleSchema(t *testing.T) {
	ctx := cuecontext.New()
	schemas := []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
	}
	result, err := GenerateSchemaDisjunction(ctx, schemas)
	require.NoError(t, err)
	assert.Len(t, result.Definitions, len(schemas))
	assert.NoError(t, buildDisjunction(t, ctx, result).Validate())
}

func TestGenerateSchemaDisjunctionMultipleSchemas(t *testing.T) {
	ctx := cuecontext.New()
	schemas := []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
		loadSchemaFromTestdata(t, "testdata/schemas/panels/second"),
		loadSchemaFromTestdata(t, "testdata/schemas/panels/third"),
	}
	result, err := GenerateSchemaDisjunction(ctx, schemas)
	require.NoError(t, err)
	assert.Len(t, result.Definitions, len(schemas))
	assert.NoError(t, buildDisjunction(t, ctx, result).Validate())
}

func TestGenerateSchemaDisjunctionEmptySchemas(t *testing.T) {
	ctx := cuecontext.New()
	_, err := GenerateSchemaDisjunction(ctx, []LoadSchema{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no plugin schemas returned")
}

func TestGenerateSchemaDefinitionsSingleSchema(t *testing.T) {
	ctx := cuecontext.New()
	schemas := []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
	}
	result, err := GenerateSchemaDefinitions(ctx, schemas)
	require.NoError(t, err)

	// The result must contain a definition named #FirstChart.
	def := result.LookupPath(cue.MakePath(cue.Def("#FirstChart")))
	assert.True(t, def.Exists(), "expected definition #FirstChart to exist in the result")
}

func TestGenerateSchemaDefinitionsMultipleSchemas(t *testing.T) {
	ctx := cuecontext.New()
	schemas := []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
		loadSchemaFromTestdata(t, "testdata/schemas/panels/second"),
	}
	result, err := GenerateSchemaDefinitions(ctx, schemas)
	require.NoError(t, err)

	assert.True(t, result.LookupPath(cue.MakePath(cue.Def("#FirstChart"))).Exists())
	assert.True(t, result.LookupPath(cue.MakePath(cue.Def("#SecondChart"))).Exists())
}

func TestGenerateSchemaDefinitionsEmptySchemas(t *testing.T) {
	ctx := cuecontext.New()
	// Empty input produces an empty struct value without error.
	result, err := GenerateSchemaDefinitions(ctx, []LoadSchema{})
	require.NoError(t, err)
	assert.NoError(t, result.Validate())
}

func TestPluginDefinitionName(t *testing.T) {
	assert.Equal(t, "#Plugin_Panel_TimeSeriesChart", pluginDefinitionName(plugin.KindPanel, "TimeSeriesChart"))
	assert.Equal(t, "#Plugin_TimeSeriesQuery_my_plugin_v2", pluginDefinitionName(plugin.KindTimeSeriesQuery, "my-plugin.v2"))
}

func TestGenerateSchemaDisjunctionDefinitionNameCollision(t *testing.T) {
	ctx := cuecontext.New()
	first := loadSchemaFromTestdata(t, "testdata/schemas/panels/first")
	second := loadSchemaFromTestdata(t, "testdata/schemas/panels/second")
	first.Name, second.Name = "my-chart", "my.chart"
	result, err := GenerateSchemaDisjunction(ctx, []LoadSchema{first, second})
	require.NoError(t, err)
	require.Len(t, result.Definitions, 2)
	var names []string
	for _, decl := range result.Definitions {
		name, _, err := ast.LabelName(decl.(*ast.Field).Label)
		require.NoError(t, err)
		names = append(names, name)
	}
	assert.Equal(t, []string{"#Plugin_Panel_my_chart", "#Plugin_Panel_my_chart_2"}, names)
	assert.NoError(t, buildDisjunction(t, ctx, result).Validate())
}

func TestReferencePluginFields(t *testing.T) {
	ctx := cuecontext.New()
	toExpr := func(src string) ast.Expr {
		v := ctx.CompileString(src)
		require.NoError(t, v.Err())
		expr, err := apiCue.ValueToASTExpr(v)
		require.NoError(t, err)
		return expr
	}

	t.Run("regular fields are referenced, definitions and hidden fields are left out", func(t *testing.T) {
		branch, ok := referencePluginFields(toExpr(`kind: "A", spec: close({v?: #v, w: v}), #v: {a?: string, b: a}, _h: #v`), "#Plugin_Panel_A")
		require.True(t, ok)
		data, err := format.Node(branch)
		require.NoError(t, err)
		assert.Equal(t, "{\n\tkind: #Plugin_Panel_A.kind\n\tspec: #Plugin_Panel_A.spec\n}", string(data))
	})

	t.Run("optional or required fields can't be referenced", func(t *testing.T) {
		_, ok := referencePluginFields(toExpr(`kind: "A", spec: {}, metadata?: {version: string}`), "#Plugin_Panel_A")
		assert.False(t, ok)
		_, ok = referencePluginFields(toExpr(`kind: "A", spec!: {}`), "#Plugin_Panel_A")
		assert.False(t, ok)
	})

	t.Run("fields depending on the plugin root can't be referenced", func(t *testing.T) {
		for _, src := range []string{
			`kind: "A", spec: {x: string, y: #Y}, #Y: spec.x`,
			`kind: "A", spec: {x: string, y: _h}, _h: spec.x`,
			`kind: "A", spec: {x: string, k: kind}`,
		} {
			_, ok := referencePluginFields(toExpr(src), "#Plugin_Panel_A")
			assert.False(t, ok, src)
		}
	})

	t.Run("plugin with an embedding can't be referenced", func(t *testing.T) {
		expr := &ast.StructLit{Elts: []ast.Decl{
			&ast.Field{Label: ast.NewIdent("kind"), Value: ast.NewString("A")},
			&ast.EmbedDecl{Expr: ast.NewIdent("X")},
		}}
		_, ok := referencePluginFields(expr, "#Plugin_Panel_A")
		assert.False(t, ok)
	})
}

func TestGenerateSchemaDisjunctionWithDefinitions(t *testing.T) {
	ctx := cuecontext.New()
	plugins, err := GenerateSchemaDisjunction(ctx, []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
		loadSchemaFromTestdata(t, "testdata/dashboard_schema/panels/palette"),
	})
	require.NoError(t, err)
	result := buildDisjunction(t, ctx, plugins)
	assert.NoError(t, result.Validate())

	// definitions of the plugins are not part of the disjunction branches
	palette := ctx.CompileString(`{kind: "PaletteChart", spec: {visual: palette: {mode: "categorical", name: "tableau10"}}}`)
	assert.NoError(t, result.Unify(palette).Validate(cue.Concrete(true)))
	assert.False(t, result.Unify(palette).LookupPath(cue.MakePath(cue.Def("#palette"))).Exists())

	invalid := ctx.CompileString(`{kind: "PaletteChart", spec: {visual: palette: {mode: "categorical", name: "unknown"}}}`)
	assert.Error(t, result.Unify(invalid).Validate(cue.Concrete(true)))
}
