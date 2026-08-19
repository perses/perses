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

package config

import (
	"testing"

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
)

func TestTimeRange_Verify(t *testing.T) {
	testSuite := []struct {
		title           string
		options         []common.DurationString
		errMessage      string
		expectedOptions []common.DurationString
	}{
		{
			title:           "defaults are used and already sorted when no options are provided",
			options:         nil,
			expectedOptions: defaultTimeRangeOptions,
		},
		{
			title:           "custom options are sorted ascending",
			options:         []common.DurationString{"1h", "5m", "7d", "30m"},
			expectedOptions: []common.DurationString{"5m", "30m", "1h", "7d"},
		},
		{
			title:      "invalid option returns an error",
			options:    []common.DurationString{"1h", "not-a-duration"},
			errMessage: "not-a-duration",
		},
		{
			title:           "already sorted options are kept as-is",
			options:         []common.DurationString{"5m", "1h", "7d"},
			expectedOptions: []common.DurationString{"5m", "1h", "7d"},
		},
		{
			title:           "relative order of equivalent durations is kept",
			options:         []common.DurationString{"60m", "1h", "5m"},
			expectedOptions: []common.DurationString{"5m", "60m", "1h"},
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			tr := &TimeRange{Options: test.options}
			err := tr.Verify()
			if len(test.errMessage) == 0 {
				assert.NoError(t, err)
				assert.Equal(t, test.expectedOptions, tr.Options)
			} else {
				assert.ErrorContains(t, err, test.errMessage)
			}
		})
	}
}
