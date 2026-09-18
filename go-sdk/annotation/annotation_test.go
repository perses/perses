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

package annotation_test

import (
	"errors"
	"testing"

	"github.com/perses/perses/go-sdk/annotation"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func validOption() annotation.Option {
	return annotation.Option{
		Kind: plugin.KindAnnotation,
		Plugin: plugin.Plugin{
			Kind: "TestAnnotation",
			Spec: map[string]any{"query": "up"},
		},
	}
}

func TestNew(t *testing.T) {
	a, err := annotation.New("Deployments", validOption())

	require.NoError(t, err)
	assert.Equal(t, "Deployments", a.Display.Name)
	assert.Equal(t, "TestAnnotation", a.Plugin.Kind)
}

func TestNewWithDisplayOptions(t *testing.T) {
	a, err := annotation.New("Deployments", validOption(),
		annotation.Description("Production deployments"),
		annotation.Hidden(true),
		annotation.Color("#ff0000"),
	)

	require.NoError(t, err)
	assert.Equal(t, "Production deployments", a.Display.Description)
	assert.True(t, a.Display.Hidden)
	assert.Equal(t, "#ff0000", a.Display.Color)
}

func TestNewRejectsIncorrectPluginKind(t *testing.T) {
	_, err := annotation.New("Deployments", annotation.Option{Kind: plugin.KindTimeSeriesQuery})

	require.EqualError(t, err, "invalid plugin kind for an annotation: TimeSeriesQuery")
}

func TestNewPropagatesPluginBuilderError(t *testing.T) {
	want := errors.New("invalid annotation query")
	option := validOption()
	option.Error = want

	_, err := annotation.New("Deployments", option)

	require.ErrorIs(t, err, want)
}
