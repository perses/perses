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

package dashboard

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTimezoneOption(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		title         string
		name          string
		timezone      string
		wantErr       bool
		wantTimezone  string
		checkJSONEmit bool
	}{
		{
			title:         "UTC is accepted and emitted in JSON",
			name:          "spaceview",
			timezone:      "UTC",
			wantTimezone:  "UTC",
			checkJSONEmit: true,
		},
		{
			title:        "local is accepted",
			name:         "local-tz",
			timezone:     "local",
			wantTimezone: "local",
		},
		{
			title:        "IANA zone is accepted",
			name:         "paris-tz",
			timezone:     "Europe/Paris",
			wantTimezone: "Europe/Paris",
		},
		{
			title:    "invalid timezone is rejected",
			name:     "bad-tz",
			timezone: "Not/A_Real_Place",
			wantErr:  true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.title, func(t *testing.T) {
			t.Parallel()

			b, err := New(tc.name, Timezone(tc.timezone))
			if tc.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tc.wantTimezone, b.Dashboard.Spec.Timezone)

			if !tc.checkJSONEmit {
				return
			}
			raw, err := json.Marshal(b.Dashboard)
			require.NoError(t, err)
			var m map[string]any
			require.NoError(t, json.Unmarshal(raw, &m))
			spec, ok := m["spec"].(map[string]any)
			require.True(t, ok, "missing spec in %s", raw)
			assert.Equal(t, tc.wantTimezone, spec["timezone"])
		})
	}
}
