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

func TestTimeRange_VerifyDefaultsAreSorted(t *testing.T) {
	tr := &TimeRange{}
	assert.NoError(t, tr.Verify())
	assert.Equal(t, defaultTimeRangeOptions, tr.Options)
}

func TestTimeRange_VerifySortsCustomOptions(t *testing.T) {
	tr := &TimeRange{
		Options: []common.DurationString{"1h", "5m", "7d", "30m"},
	}
	assert.NoError(t, tr.Verify())
	assert.Equal(t, []common.DurationString{"5m", "30m", "1h", "7d"}, tr.Options)
}

func TestTimeRange_VerifyRejectsInvalidOption(t *testing.T) {
	tr := &TimeRange{
		Options: []common.DurationString{"1h", "not-a-duration"},
	}
	assert.Error(t, tr.Verify())
}

func TestTimeRange_VerifyKeepsAlreadySortedOptions(t *testing.T) {
	tr := &TimeRange{
		Options: []common.DurationString{"5m", "1h", "7d"},
	}
	assert.NoError(t, tr.Verify())
	assert.Equal(t, []common.DurationString{"5m", "1h", "7d"}, tr.Options)
}

func TestTimeRange_VerifyKeepsRelativeOrderOfEquivalentDurations(t *testing.T) {
	tr := &TimeRange{
		Options: []common.DurationString{"60m", "1h", "5m"},
	}
	assert.NoError(t, tr.Verify())
	assert.Equal(t, []common.DurationString{"5m", "60m", "1h"}, tr.Options)
}
