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

package datasource

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSelectorMarshalJSON(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title    string
		selector Selector
		want     string
	}{
		{
			title:    "variable reference marshals as plain string",
			selector: Selector{Kind: "PrometheusDatasource", Name: "$myDatasource"},
			want:     `"$myDatasource"`,
		},
		{
			title:    "concrete name marshals as structured object",
			selector: Selector{Kind: "PrometheusDatasource", Name: "myDatasource"},
			want:     `{"kind":"PrometheusDatasource","name":"myDatasource"}`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			b, err := json.Marshal(tc.selector)
			require.NoError(t, err)
			assert.Equal(t, tc.want, string(b))
		})
	}
}

func TestSelectorUnmarshalJSON(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title    string
		input    string
		wantName string
		wantKind string
	}{
		{
			title:    "plain string form sets Name, leaves Kind empty",
			input:    `"$myDatasource"`,
			wantName: "$myDatasource",
			wantKind: "",
		},
		{
			title:    "structured object form sets both fields",
			input:    `{"kind":"PrometheusDatasource","name":"myDatasource"}`,
			wantName: "myDatasource",
			wantKind: "PrometheusDatasource",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			var s Selector
			require.NoError(t, json.Unmarshal([]byte(tc.input), &s))
			assert.Equal(t, tc.wantName, s.Name)
			assert.Equal(t, tc.wantKind, s.Kind)
		})
	}
}
