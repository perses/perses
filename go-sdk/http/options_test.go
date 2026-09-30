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

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTimeoutOption(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title       string
		timeout     string
		wantTimeout common.DurationString
		wantErr     string
	}{
		{
			title:       "seconds",
			timeout:     "10s",
			wantTimeout: "10s",
		},
		{
			title:       "the input is preserved",
			timeout:     "1m30s",
			wantTimeout: "1m30s",
		},
		{
			title:   "zero is rejected",
			timeout: "0",
			wantErr: "HTTP proxy timeout must be greater than zero",
		},
		{
			title:   "zero with a unit is rejected",
			timeout: "0s",
			wantErr: "HTTP proxy timeout must be greater than zero",
		},
		{
			title:   "empty is rejected",
			timeout: "",
			wantErr: "empty duration string",
		},
		{
			title:   "negative is rejected",
			timeout: "-10s",
			wantErr: `not a valid duration string: "-10s"`,
		},
		{
			title:   "invalid duration is rejected",
			timeout: "10 seconds",
			wantErr: `unknown unit " seconds" in duration "10 seconds"`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			b, err := New("http://localhost:9090", Timeout(tc.timeout))
			if len(tc.wantErr) > 0 {
				assert.EqualError(t, err, tc.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tc.wantTimeout, b.Spec.Timeout)

			// The timeout must be emitted in the proxy spec.
			raw, err := json.Marshal(b)
			require.NoError(t, err)
			var m map[string]any
			require.NoError(t, json.Unmarshal(raw, &m))
			spec, ok := m["spec"].(map[string]any)
			require.True(t, ok, "missing spec in %s", raw)
			assert.Equal(t, string(tc.wantTimeout), spec["timeout"])
		})
	}
}

func TestNoTimeoutByDefault(t *testing.T) {
	t.Parallel()

	b, err := New("http://localhost:9090")
	require.NoError(t, err)
	assert.Empty(t, b.Spec.Timeout)

	// When not set, the timeout must not be emitted, so the server uses its default timeout.
	raw, err := json.Marshal(b)
	require.NoError(t, err)
	assert.NotContains(t, string(raw), "timeout")
}
