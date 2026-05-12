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

package utils

import (
	"strings"
	"testing"

	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/cuecontext"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCastASTNodeToASTExprASTExpr(t *testing.T) {
	// A plain ast.Expr (e.g. *ast.StructLit) must be returned as-is.
	s := &ast.StructLit{}
	expr, err := CastASTNodeToASTExpr(s)
	require.NoError(t, err)
	assert.Equal(t, s, expr)
}

func TestCastASTNodeToASTExprASTFile(t *testing.T) {
	// An *ast.File returned by value.Syntax() must be unwrapped into a StructLit,
	// dropping any package/import declarations.
	ctx := cuecontext.New()
	v := ctx.CompileString(`a: 1`)
	node := v.Syntax(CueSyntaxOptions...)
	expr, err := CastASTNodeToASTExpr(node)
	require.NoError(t, err)
	assert.NotNil(t, expr)
	// The resulting expression must be a StructLit (no package wrapper).
	_, ok := expr.(*ast.StructLit)
	assert.True(t, ok, "expected *ast.StructLit, got %T", expr)
}

func TestCastASTNodeToASTExprUnknownType(t *testing.T) {
	// An unrecognised ast.Node type must return an error containing the type name.
	type unknownNode struct{ ast.Node }
	_, err := CastASTNodeToASTExpr(unknownNode{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected ast.Node type")
}

func TestCueValueToHTTPDataValidValue(t *testing.T) {
	ctx := cuecontext.New()
	v := ctx.CompileString(`#Spec: { kind: string }`)
	require.NoError(t, v.Err())

	data, err := CueValueToHTTPData(v)
	require.NoError(t, err)
	assert.NotEmpty(t, data)
	assert.Contains(t, string(data), "kind")
}

func TestCueValueToHTTPDataRemoveExplicitErrorComment(t *testing.T) {
	// Build a CUE value that contains a bottom literal (_|_).
	// Its Syntax() output will include the comment
	// "// explicit error (_|_ literal) in source" — verify it is stripped.
	ctx := cuecontext.New()
	v := ctx.CompileString(`x: _|_`)

	data, err := CueValueToHTTPData(v)
	require.NoError(t, err)
	assert.False(t,
		strings.Contains(string(data), "// explicit error (_|_ literal) in source"),
		"output must not contain the explicit error comment",
	)
}
