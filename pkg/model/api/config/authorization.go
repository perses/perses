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
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

var (
	defaultCacheInterval = 30 * time.Second
)

type ClaimMapping struct {
	// Claim name as found in the token.
	Claim string `json:"claim,omitempty" yaml:"claim,omitempty"`
	// TODO: temporarily `string` used as role type until I figure out how are regular roles handled in code.
	Role string `json:"role,omitempty" yaml:"role,omitempty"`
}

type ClaimMappingConfig struct {
	// TODO: proper descriptions
	RoleClaimsPath string          `json:"role_claims_path,omitempty" yaml:"role_claims_path,omitempty"`
	ClaimMapping   []*ClaimMapping `json:"claim_mapping,omitempty" yaml:"claim_mapping,omitempty"`
}

type AuthorizationConfig struct {
	// CheckLatestUpdateInterval that checks if the RBAC cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*role.Permission `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
	//
	ClaimMappingConfig ClaimMappingConfig `json:"claim_mapping_config,omitempty" yaml:"claim_mapping_config,omitempty"`
}

func (a *AuthorizationConfig) Verify() error {
	if a.CheckLatestUpdateInterval <= 0 {
		a.CheckLatestUpdateInterval = common.Duration(defaultCacheInterval)
	}
	if a.GuestPermissions == nil {
		a.GuestPermissions = []*role.Permission{}
	}
	return nil
}
