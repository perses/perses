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

package proxy

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestTransportKeys ensures the datasources of the different scopes never share the same transport key,
// even when they have the same name.
func TestTransportKeys(t *testing.T) {
	keys := []string{
		globalTransportKey("a"),
		projectTransportKey("p", "a"),
		dashboardTransportKey("p", "d", "a"),
		// The project and dashboard names are not mixed up.
		projectTransportKey("a", "p"),
		dashboardTransportKey("d", "p", "a"),
	}
	seen := map[string]bool{}
	for _, key := range keys {
		assert.NotEmpty(t, key)
		assert.False(t, seen[key], "duplicated key %q", key)
		seen[key] = true
	}
}
