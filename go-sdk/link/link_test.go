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

package link

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewTagMenu(t *testing.T) {
	builder, err := NewTagMenu(" Service detail ", []string{" traffic ", "api"}, KeepTime(true), IncludeVariables(true))
	require.NoError(t, err)
	assert.Equal(t, "Service detail", builder.Name)
	assert.Equal(t, []string{"traffic", "api"}, builder.Tags)
	assert.True(t, builder.KeepTime)
	assert.True(t, builder.IncludeVariables)
	assert.Empty(t, builder.URL)
}

func TestNewTagMenuRejectsURL(t *testing.T) {
	_, err := NewTagMenu("Menu", []string{"traffic"}, URL("https://perses.dev"))
	require.Error(t, err)
}

func TestNewRejectsTags(t *testing.T) {
	_, err := New("https://perses.dev", Tags([]string{"traffic"}))
	require.Error(t, err)
}
