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
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"time"
)

// jsonSchemas is only used to marshal the config in a proper json format
// (mainly because of the duration that is not yet supported by json).
type jsonAuthorizationConfig struct {
	Interval string `json:"interval,omitempty"`
}

type AuthorizationConfig struct {
	// Enable caching for permissions, highly recommended
	ActivateCache *bool `json:"activate_cache,omitempty" yaml:"activate_cache,omitempty"`
	// Interval is the refresh frequency of the cache
	Interval         time.Duration    `json:"interval" yaml:"interval"`
	GuestPermissions []*v1.Permission `json:"guest_permissions" yaml:"guest_permissions"`
}

func (p *AuthorizationConfig) Verify() error {
	if p.Interval <= 0 {
		p.Interval = defaultInterval
	}
	if p.ActivateCache != nil {
		var activateCache = true
		p.ActivateCache = &activateCache
	}
	return nil
}

func (p AuthorizationConfig) MarshalJSON() ([]byte, error) {
	j := &jsonAuthorizationConfig{
		Interval: p.Interval.String(),
	}
	return json.Marshal(j)
}
