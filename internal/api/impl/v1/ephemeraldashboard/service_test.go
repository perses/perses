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

package ephemeraldashboard

import (
	"testing"
	"time"

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
)

func TestValidateTTL(t *testing.T) {
	testSuite := []struct {
		title          string
		ttl            common.Duration
		maxTTL         common.Duration
		expectedErrMsg string
	}{
		{
			title:  "no maximum configured",
			ttl:    common.Duration(365 * 24 * time.Hour),
			maxTTL: 0,
		},
		{
			title:  "ttl below the maximum",
			ttl:    common.Duration(time.Hour),
			maxTTL: common.Duration(24 * time.Hour),
		},
		{
			title:  "ttl equals the maximum",
			ttl:    common.Duration(24 * time.Hour),
			maxTTL: common.Duration(24 * time.Hour),
		},
		{
			title:          "ttl above the maximum",
			ttl:            common.Duration(25 * time.Hour),
			maxTTL:         common.Duration(24 * time.Hour),
			expectedErrMsg: "ttl 1d1h is greater than the maximum allowed by the server (1d)",
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := validateTTL(test.ttl, test.maxTTL)
			if len(test.expectedErrMsg) == 0 {
				assert.NoError(t, err)
				return
			}
			assert.EqualError(t, err, test.expectedErrMsg)
		})
	}
}
