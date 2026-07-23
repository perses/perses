// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package migrate

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSimplifiedDashboardUnmarshal(t *testing.T) {
	tests := []struct {
		title    string
		data     string
		expected *SimplifiedDashboard
	}{
		{
			title: "Single panel",
			data: `{
    "title": "Test Dashboard",
    "panels": [
      {
        "id": 1,
        "title": "Panel 1",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(metric[5m])"
          }
        ]
      }
    ]
  }`,
			expected: &SimplifiedDashboard{
				Title: "Test Dashboard",
				Panels: []Panel{
					{
						Title: "Panel 1",
						Type:  "timeseries",
						Targets: []json.RawMessage{
							json.RawMessage(`{
            "expr": "rate(metric[5m])"
          }`),
						},
						RawMessage: json.RawMessage(`{"id":1,"targets":[{"expr":"rate(metric[5m])"}],"title":"Panel 1","type":"timeseries"}`),
					},
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			result := &SimplifiedDashboard{}
			if err := json.Unmarshal([]byte(test.data), result); err != nil {
				t.Fatalf("failed to unmarshal JSON: %s", err)
			}
			assert.Equal(t, test.expected, result)
		})
	}
}
