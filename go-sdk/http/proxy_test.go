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

package http

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNew(t *testing.T) {
	t.Parallel()

	b, err := New("http://localhost:9090")
	require.NoError(t, err)

	// The schema of the datasources only accepts the kind "HTTPProxy".
	raw, err := json.Marshal(b)
	require.NoError(t, err)
	assert.JSONEq(t, `{"kind":"HTTPProxy","spec":{"url":"http://localhost:9090"}}`, string(raw))
}
