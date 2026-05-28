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
	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
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
