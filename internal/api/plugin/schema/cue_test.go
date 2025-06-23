// Copyright 2025 The Perses Authors
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

	"github.com/stretchr/testify/assert"
)

// NB: most of the nominal cases are already covered in schema_test.go
func TestLoadModelSchema(t *testing.T) {
	testSuite := []struct {
		desc        string
		schemaPath  string
		wantErr     bool
		expectedErr string
	}{
		{
			desc:        "invalid panel schema - missing kind",
			schemaPath:  "testdata/schemas/panels/no_kind/",
			wantErr:     true,
			expectedErr: "required `kind` field is missing",
		},
		{
			desc:        "invalid panel schema - invalid kind",
			schemaPath:  "testdata/schemas/panels/invalid_kind/",
			wantErr:     true,
			expectedErr: "`kind` is not a string",
		},
		{
			desc:        "invalid variable schema - missing spec",
			schemaPath:  "testdata/schemas/variables/no_spec/",
			wantErr:     true,
			expectedErr: "required `spec` field is missing",
		},
		{
			desc:        "invalid variable schema - invalid spec",
			schemaPath:  "testdata/schemas/variables/invalid_spec/",
			wantErr:     true,
			expectedErr: "`spec` is of wrong type",
		},
		{
			desc:        "invalid query schema - invalid spec",
			schemaPath:  "testdata/schemas/queries/invalid_spec/",
			wantErr:     true,
			expectedErr: "`spec` is of wrong type",
		},
		{
			desc:       "valid panel schema that uses disjunction at the spec's root",
			schemaPath: "testdata/schemas/panels/disjunct/",
			wantErr:    false,
		},
	}

	for _, test := range testSuite {
		t.Run(test.desc, func(t *testing.T) {
			_, _, err := LoadModelSchema(test.schemaPath)
			if test.wantErr {
				assert.Error(t, err)
				assert.ErrorContains(t, err, test.expectedErr)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
