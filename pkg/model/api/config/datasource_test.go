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
	"time"

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDatasourceConfigVerify(t *testing.T) {
	for _, test := range []struct {
		name        string
		config      DatasourceConfig
		wantDefault time.Duration
		wantMax     time.Duration
		wantError   string
	}{
		{
			name:        "defaults",
			wantDefault: 30 * time.Second,
			wantMax:     30 * time.Second,
		},
		{
			name: "custom limits",
			config: DatasourceConfig{
				HTTPProxyDefaultTimeout: common.Duration(15 * time.Second),
				HTTPProxyMaxTimeout:     common.Duration(time.Minute),
			},
			wantDefault: 15 * time.Second,
			wantMax:     time.Minute,
		},
		{
			name: "default exceeds maximum",
			config: DatasourceConfig{
				HTTPProxyDefaultTimeout: common.Duration(time.Minute),
				HTTPProxyMaxTimeout:     common.Duration(30 * time.Second),
			},
			wantError: "the HTTP proxy default timeout cannot exceed the maximum timeout",
		},
		{
			name: "negative default",
			config: DatasourceConfig{
				HTTPProxyDefaultTimeout: common.Duration(-time.Second),
			},
			wantError: "the HTTP proxy default timeout cannot be negative",
		},
		{
			name: "negative maximum",
			config: DatasourceConfig{
				HTTPProxyMaxTimeout: common.Duration(-time.Second),
			},
			wantError: "the HTTP proxy maximum timeout cannot be negative",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			cfg := test.config
			err := cfg.Verify()
			if test.wantError != "" {
				require.EqualError(t, err, test.wantError)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.wantDefault, cfg.GetHTTPProxyDefaultTimeout())
			assert.Equal(t, test.wantMax, cfg.GetHTTPProxyMaxTimeout())
		})
	}
}

func TestDatasourceConfigGetTimeoutsClampUnverifiedConfig(t *testing.T) {
	cfg := DatasourceConfig{
		HTTPProxyDefaultTimeout: common.Duration(time.Minute),
		HTTPProxyMaxTimeout:     common.Duration(15 * time.Second),
	}

	assert.Equal(t, 15*time.Second, cfg.GetHTTPProxyDefaultTimeout())
	assert.Equal(t, 15*time.Second, cfg.GetHTTPProxyMaxTimeout())
}
