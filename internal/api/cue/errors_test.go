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
	"errors"
	"testing"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/stretchr/testify/assert"
)

func TestFormatErrors(t *testing.T) {
	ctx := cuecontext.New()
	schema := ctx.CompileString(`#Dashboard: close({
	kind:     "Dashboard"
	duration: string
	refresh?: "1m" | "5m"
})`)
	testSuites := []struct {
		title    string
		data     string
		expected string
	}{
		{
			title:    "unknown field",
			data:     `{kind: "Dashboard", duration: "1h", durration: "1h"}`,
			expected: "durration: field not allowed",
		},
		{
			title: "value not in an enum",
			data:  `{kind: "Dashboard", duration: "1h", refresh: "2m"}`,
			expected: `refresh: 2 errors in empty disjunction:
refresh: conflicting values "1m" and "2m"
refresh: conflicting values "5m" and "2m"`,
		},
		{
			title:    "missing field",
			data:     `{kind: "Dashboard"}`,
			expected: "duration: incomplete value string",
		},
	}
	for _, test := range testSuites {
		t.Run(test.title, func(t *testing.T) {
			definition := schema.LookupPath(cue.ParsePath("#Dashboard"))
			err := definition.Unify(ctx.CompileString(test.data)).Validate(cue.Concrete(true))
			assert.EqualError(t, FormatErrors(err), test.expected)
		})
	}
}

func TestFormatErrorsNotCUE(t *testing.T) {
	err := errors.New("not a CUE error")
	assert.Equal(t, err, FormatErrors(err))
}
