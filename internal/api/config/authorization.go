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

	"github.com/perses/perses/pkg/model/api/v1/role"
)

var (
	defaultCacheInterval = 10 * time.Minute
)

// jsonSchemas is only used to marshal the config in a proper json format
// (mainly because of the duration that is not yet supported by json).
type jsonAuthorizationConfig struct {
	EnableAuthorization bool               `json:"enable_authorization"`
	Interval            string             `json:"interval,omitempty"`
	GuestPermissions    []*role.Permission `json:"guest_permissions"`
}

type AuthorizationConfig struct {
	// ActivatePermission is activating or deactivating the permission verification on each endpoint
	EnableAuthorization bool `json:"enable_authorization" yaml:"enable_authorization"`
	// Interval is the refresh frequency of the cache
	Interval time.Duration `json:"interval,omitempty" yaml:"interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*role.Permission `json:"guest_permissions" yaml:"guest_permissions"`
}

func (a *AuthorizationConfig) Verify() error {
	if a.Interval <= 0 {
		a.Interval = defaultCacheInterval
	}
	if a.GuestPermissions == nil {
		a.GuestPermissions = []*role.Permission{}
	}
	return nil
}

func (a *AuthorizationConfig) MarshalJSON() ([]byte, error) {
	j := &jsonAuthorizationConfig{
		Interval: a.Interval.String(),
	}
	return json.Marshal(j)
}
