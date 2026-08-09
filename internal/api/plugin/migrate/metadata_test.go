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

package migrate

import (
	"strings"
	"testing"

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateMetadataName(t *testing.T) {
	tests := []struct {
		title    string
		expected string
	}{
		{
			title:    "My Awesome Dashboard",
			expected: "My_Awesome_Dashboard",
		},
		{
			title:    "cpu.usage-per_node",
			expected: "cpu.usage-per_node",
		},
		{
			title:    "Café Métriques",
			expected: "Cafe_Metriques",
		},
		{
			title:    "Load (%) / node #1",
			expected: "Load_______node__1",
		},
		{
			title:    "",
			expected: "",
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			result := generateMetadataName(test.title)
			assert.Equal(t, test.expected, result)
			if len(result) > 0 {
				assert.NoError(t, common.ValidateID(result))
			}
		})
	}
}

func TestGenerateMetadataNameIsTruncatedToValidLength(t *testing.T) {
	result := generateMetadataName(strings.Repeat("a", 200))
	assert.Len(t, result, maxMetadataNameLength)
	require.NoError(t, common.ValidateID(result))
}
