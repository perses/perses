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
	"gopkg.in/yaml.v3"
)

func TestNewVariableSelector(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title    string
		input    string
		wantName string // bare name without "$"
		wantErr  string
	}{
		{title: "bare name", input: "myDatasource", wantName: "myDatasource"},
		{title: "dollar prefix", input: "$myDatasource", wantName: "myDatasource"},
		{title: "braces prefix", input: "${myDatasource}", wantName: "myDatasource"},
		{title: "pure number rejected", input: "123", wantErr: `invalid variable name "123"`},
		{title: "pure number with dollar rejected", input: "$1", wantErr: `invalid variable name "1"`},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			s, err := NewVariableSelector(tc.input)
			if tc.wantErr != "" {
				assert.ErrorContains(t, err, tc.wantErr)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, s.Variable)
			assert.Equal(t, tc.wantName, s.Variable.Name)
			assert.Nil(t, s.Static)
		})
	}
}

func TestSelectorMarshalJSON(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title    string
		selector Selector
		want     string
		wantErr  string
	}{
		{
			title:    "variable reference marshals as plain string",
			selector: Selector{Variable: &VariableSelector{Name: "myDatasource"}},
			want:     `"$myDatasource"`,
		},
		{
			title:    "concrete datasource marshals as structured object",
			selector: Selector{Static: &StaticSelector{Kind: "PrometheusDatasource", Name: "myDatasource"}},
			want:     `{"kind":"PrometheusDatasource","name":"myDatasource"}`,
		},
		{
			title:    "invalid variable reference returns error",
			selector: Selector{Variable: &VariableSelector{Name: "1"}},
			wantErr:  "invalid variable reference",
		},
		{
			title:    "zero value returns error",
			selector: Selector{},
			wantErr:  "must have exactly one of Static or Variable set",
		},
		{
			title: "both fields set returns error",
			selector: Selector{
				Static:   &StaticSelector{Kind: "PrometheusDatasource", Name: "myDatasource"},
				Variable: &VariableSelector{Name: "myDatasource"},
			},
			wantErr: "must have exactly one of Static or Variable set",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			b, err := json.Marshal(tc.selector)
			if tc.wantErr != "" {
				assert.ErrorContains(t, err, tc.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tc.want, string(b))
		})
	}
}

func TestSelectorUnmarshalJSON(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title       string
		input       string
		wantStatic  *StaticSelector
		wantVarName string
		wantZero    bool
		wantErr     string
	}{
		{
			title:       "dollar-prefixed string sets Variable",
			input:       `"$myDatasource"`,
			wantVarName: "myDatasource",
		},
		{
			title:      "structured object sets Static",
			input:      `{"kind":"PrometheusDatasource","name":"myDatasource"}`,
			wantStatic: &StaticSelector{Kind: "PrometheusDatasource", Name: "myDatasource"},
		},
		{
			title:   "pure-number variable name rejected",
			input:   `"$1"`,
			wantErr: "invalid variable reference",
		},
		{
			title:    "JSON null is a no-op",
			input:    `null`,
			wantZero: true,
		},
		{
			title:   "string without dollar prefix rejected",
			input:   `"myDatasource"`,
			wantErr: "string selectors must start with",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			var s Selector
			err := json.Unmarshal([]byte(tc.input), &s)
			if tc.wantErr != "" {
				assert.ErrorContains(t, err, tc.wantErr)
				return
			}
			require.NoError(t, err)
			if tc.wantZero {
				assert.Nil(t, s.Static)
				assert.Nil(t, s.Variable)
			} else if tc.wantStatic != nil {
				require.NotNil(t, s.Static)
				assert.Equal(t, tc.wantStatic.Kind, s.Static.Kind)
				assert.Equal(t, tc.wantStatic.Name, s.Static.Name)
				assert.Nil(t, s.Variable)
			} else {
				require.NotNil(t, s.Variable)
				assert.Equal(t, tc.wantVarName, s.Variable.Name)
				assert.Nil(t, s.Static)
			}
		})
	}
}

func TestSelectorMarshalYAML(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title    string
		selector Selector
		want     string
		wantErr  string
	}{
		{
			title:    "variable reference marshals as plain string",
			selector: Selector{Variable: &VariableSelector{Name: "myDatasource"}},
			want:     "$myDatasource\n",
		},
		{
			title:    "concrete datasource marshals as structured mapping",
			selector: Selector{Static: &StaticSelector{Kind: "PrometheusDatasource", Name: "myDatasource"}},
			want:     "kind: PrometheusDatasource\nname: myDatasource\n",
		},
		{
			title:    "invalid variable reference returns error",
			selector: Selector{Variable: &VariableSelector{Name: "1"}},
			wantErr:  "invalid variable reference",
		},
		{
			title:    "zero value returns error",
			selector: Selector{},
			wantErr:  "must have exactly one of Static or Variable set",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			b, err := yaml.Marshal(tc.selector)
			if tc.wantErr != "" {
				assert.ErrorContains(t, err, tc.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tc.want, string(b))
		})
	}
}

func TestSelectorUnmarshalYAML(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title       string
		input       string
		wantStatic  *StaticSelector
		wantVarName string
		wantZero    bool
		wantErr     string
	}{
		{
			title:       "dollar-prefixed string sets Variable",
			input:       `$myDatasource`,
			wantVarName: "myDatasource",
		},
		{
			title:      "mapping sets Static",
			input:      "kind: PrometheusDatasource\nname: myDatasource",
			wantStatic: &StaticSelector{Kind: "PrometheusDatasource", Name: "myDatasource"},
		},
		{
			title:   "integer scalar is rejected",
			input:   `123`,
			wantErr: "datasource selector must be a string or a mapping, got !!int",
		},
		{
			title:   "boolean scalar is rejected",
			input:   `true`,
			wantErr: "datasource selector must be a string or a mapping, got !!bool",
		},
		{
			title:   "pure-number variable name rejected",
			input:   `"$1"`,
			wantErr: "invalid variable reference",
		},
		{
			title:    "YAML null is a no-op",
			input:    `~`,
			wantZero: true,
		},
		{
			title:   "string without dollar prefix rejected",
			input:   `myDatasource`,
			wantErr: "string selectors must start with",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			var s Selector
			err := yaml.Unmarshal([]byte(tc.input), &s)
			if tc.wantErr != "" {
				assert.ErrorContains(t, err, tc.wantErr)
				return
			}
			require.NoError(t, err)
			if tc.wantZero {
				assert.Nil(t, s.Static)
				assert.Nil(t, s.Variable)
			} else if tc.wantStatic != nil {
				require.NotNil(t, s.Static)
				assert.Equal(t, tc.wantStatic.Kind, s.Static.Kind)
				assert.Equal(t, tc.wantStatic.Name, s.Static.Name)
				assert.Nil(t, s.Variable)
			} else {
				require.NotNil(t, s.Variable)
				assert.Equal(t, tc.wantVarName, s.Variable.Name)
				assert.Nil(t, s.Static)
			}
		})
	}
}

func TestSelectorReceiverReset(t *testing.T) {
	t.Parallel()

	t.Run("JSON: variable decode clears prior Static", func(t *testing.T) {
		t.Parallel()
		s := Selector{Static: &StaticSelector{Kind: "PrometheusDatasource", Name: "old"}}
		require.NoError(t, json.Unmarshal([]byte(`"$newDs"`), &s))
		assert.Nil(t, s.Static)
		require.NotNil(t, s.Variable)
		assert.Equal(t, "newDs", s.Variable.Name)
	})

	t.Run("JSON: static decode clears prior Variable", func(t *testing.T) {
		t.Parallel()
		s := Selector{Variable: &VariableSelector{Name: "old"}}
		require.NoError(t, json.Unmarshal([]byte(`{"kind":"PrometheusDatasource","name":"new"}`), &s))
		assert.Nil(t, s.Variable)
		require.NotNil(t, s.Static)
		assert.Equal(t, "PrometheusDatasource", s.Static.Kind)
	})

	t.Run("YAML: variable decode clears prior Static", func(t *testing.T) {
		t.Parallel()
		s := Selector{Static: &StaticSelector{Kind: "PrometheusDatasource", Name: "old"}}
		require.NoError(t, yaml.Unmarshal([]byte(`$newDs`), &s))
		assert.Nil(t, s.Static)
		require.NotNil(t, s.Variable)
		assert.Equal(t, "newDs", s.Variable.Name)
	})

	t.Run("YAML: static decode clears prior Variable", func(t *testing.T) {
		t.Parallel()
		s := Selector{Variable: &VariableSelector{Name: "old"}}
		require.NoError(t, yaml.Unmarshal([]byte("kind: PrometheusDatasource\nname: new"), &s))
		assert.Nil(t, s.Variable)
		require.NotNil(t, s.Static)
		assert.Equal(t, "PrometheusDatasource", s.Static.Kind)
	})
}
