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

package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTracing_Verify(t *testing.T) {
	testSuite := []struct {
		title      string
		tracing    Tracing
		errMessage string
	}{
		{
			title:   "disabled tracing doesn't need any other setting",
			tracing: Tracing{},
		},
		{
			title:   "enabled tracing with an endpoint",
			tracing: Tracing{Enable: true, Endpoint: "otel-collector:4317", Insecure: true},
		},
		{
			title:   "enabled tracing with a sampling ratio",
			tracing: Tracing{Enable: true, Endpoint: "otel-collector:4317", SamplingRatio: 0.25},
		},
		{
			title:      "enabled tracing requires an endpoint",
			tracing:    Tracing{Enable: true},
			errMessage: "tracing.endpoint must be set",
		},
		{
			title:      "sampling ratio above 1 is rejected",
			tracing:    Tracing{Enable: true, Endpoint: "otel-collector:4317", SamplingRatio: 1.5},
			errMessage: "tracing.sampling_ratio must be between 0 and 1",
		},
		{
			title:      "negative sampling ratio is rejected",
			tracing:    Tracing{Enable: true, Endpoint: "otel-collector:4317", SamplingRatio: -0.1},
			errMessage: "tracing.sampling_ratio must be between 0 and 1",
		},
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := test.tracing.Verify()
			if len(test.errMessage) == 0 {
				assert.NoError(t, err)
			} else {
				assert.ErrorContains(t, err, test.errMessage)
			}
		})
	}
}
