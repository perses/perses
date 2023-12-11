// Copyright 2023 The Perses Authors
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
	"encoding/json"
	"time"
)

// jsonSchemas is only used to marshal the config in a proper json format
// (mainly because of the duration that is not yet supported by json).
type jsonProvisioningConfig struct {
	Folders  []string `json:"folders,omitempty"`
	Interval string   `json:"interval,omitempty"`
}

type ProvisioningConfig struct {
	Folders []string `json:"folders" yaml:"folders"`
	// Interval is the refresh frequency
	Interval time.Duration `json:"interval" yaml:"interval"`
}

func (p *ProvisioningConfig) Verify() error {
	if p.Interval <= 0 {
		p.Interval = defaultInterval
	}
	return nil
}

func (p ProvisioningConfig) MarshalJSON() ([]byte, error) {
	j := &jsonProvisioningConfig{
		Folders:  p.Folders,
		Interval: p.Interval.String(),
	}
	return json.Marshal(j)
}
