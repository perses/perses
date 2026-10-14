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

func TestGenerateSchemaDisjunctionSingleSchema(t *testing.T) {
	ctx := cuecontext.New()
	schemas := []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
	}
	result, err := GenerateSchemaDisjunction(ctx, schemas)
	require.NoError(t, err)
	assert.NoError(t, result.Validate())
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
	assert.NoError(t, result.Validate())
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

func TestIsolatePluginDefinitions(t *testing.T) {
	ctx := cuecontext.New()
	toExpr := func(src string) ast.Expr {
		v := ctx.CompileString(src)
		require.NoError(t, v.Err())
		expr, err := apiCue.ValueToASTExpr(v)
		require.NoError(t, err)
		return expr
	}

	t.Run("plugin without definitions is kept as-is", func(t *testing.T) {
		_, _, ok := isolatePluginDefinitions(toExpr(`kind: "A", spec: {a?: string}`), "PLUGIN_0")
		assert.False(t, ok)
	})

	t.Run("plugin with definitions is moved into a let clause", func(t *testing.T) {
		let, branch, ok := isolatePluginDefinitions(toExpr(`kind: "A", spec: close({v?: #v}), #v: {a?: string}`), "PLUGIN_0")
		require.True(t, ok)
		assert.Equal(t, "PLUGIN_0", let.Ident.Name)
		data, err := format.Node(branch)
		require.NoError(t, err)
		assert.Equal(t, "{\n\tkind: PLUGIN_0.kind\n\tspec: PLUGIN_0.spec\n}", string(data))
	})
}

func TestGenerateSchemaDisjunctionWithDefinitions(t *testing.T) {
	ctx := cuecontext.New()
	result, err := GenerateSchemaDisjunction(ctx, []LoadSchema{
		loadSchemaFromTestdata(t, "testdata/schemas/panels/first"),
		loadSchemaFromTestdata(t, "testdata/dashboard_schema/panels/palette"),
	})
	require.NoError(t, err)
	assert.NoError(t, result.Validate())

	// definitions of the plugins are not part of the disjunction branches anymore
	palette := ctx.CompileString(`{kind: "PaletteChart", spec: {visual: palette: {mode: "categorical", name: "tableau10"}}}`)
	assert.NoError(t, result.Unify(palette).Validate(cue.Concrete(true)))
	assert.False(t, result.Unify(palette).LookupPath(cue.MakePath(cue.Def("#palette"))).Exists())

	invalid := ctx.CompileString(`{kind: "PaletteChart", spec: {visual: palette: {mode: "categorical", name: "unknown"}}}`)
	assert.Error(t, result.Unify(invalid).Validate(cue.Concrete(true)))
}
