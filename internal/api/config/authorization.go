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
	Interval         string             `json:"interval,omitempty"`
	GuestPermissions []*role.Permission `json:"guest_permissions,omitempty"`
}

type AuthorizationConfig struct {
	// Interval that check if the RBAC cache need to be refreshed with db content. Only for SQL database setup.
	Interval time.Duration `json:"interval,omitempty" yaml:"interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*role.Permission `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
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

func (a AuthorizationConfig) MarshalJSON() ([]byte, error) {
	j := &jsonAuthorizationConfig{
		Interval:         a.Interval.String(),
		GuestPermissions: a.GuestPermissions,
	}
	return json.Marshal(j)
}
