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
	"errors"
	"fmt"
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

var (
	defaultCacheInterval = 30 * time.Second
)

// TODO: documentation
type Mapping struct {
	RoleName    string    `json:"role_name" yaml:"role_name"`
	Project     string    `json:"project,omitempty" yaml:"project,omitempty"`
	RoleClaims  []*string `json:"role_claims,omitempty" yaml:"role_claims,omitempty"`
	GroupClaims []*string `json:"group_claims,omitempty" yaml:"group_claims,omitempty"`
	// Permissions matched to role name
	Permissions []role.Permission
}

// TODO: documentation
type ClaimsMappingConfig struct {
	RoleClaimsPath  string     `json:"role_claims_path,omitempty" yaml:"role_claims_path,omitempty"`
	GroupClaimsPath string     `json:"group_claims_path,omitempty" yaml:"group_claims_path,omitempty"`
	Mapping         []*Mapping `json:"mapping,omitempty" yaml:"mapping,omitempty"`
}

type AuthorizationConfig struct {
	// CheckLatestUpdateInterval that checks if the RBAC cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*role.Permission `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
	//
	ClaimsMappingConfig *ClaimsMappingConfig `json:"claims_mapping_config,omitempty" yaml:"claims_mapping_config,omitempty"`
}

// TODO: extend this validation function
// TODO: if no project default to wildcard?
// TODO: change to ClaimsMappingConfig method?
func (a *AuthorizationConfig) validateClaimRoles() error {
	// check if either RoleClaimsPath or GroupClaimsPath is defined
	if a.ClaimsMappingConfig.RoleClaimsPath == "" && a.ClaimsMappingConfig.GroupClaimsPath == "" {
		return errors.New("No role_claims_path and group_claims_path defined")
	}
	for _, mapping := range a.ClaimsMappingConfig.Mapping {
		// check if role name defined
		// If role name defined in config does not match any existing RBAC roles, warning raised when assigning roles to permission (or simply entry omitted?)
		if mapping.RoleName == "" {
			return errors.New("No role name defined for role mapping")
		}
		// check if it has any roles/groups assigned; if not, error or remove from list?
		if mapping.RoleClaims == nil && mapping.GroupClaims == nil {
			return fmt.Errorf("No role or group claims defined for role %s", mapping.RoleName)
		}
	}
	return nil
}

func (a *AuthorizationConfig) Verify() error {
	if a.CheckLatestUpdateInterval <= 0 {
		a.CheckLatestUpdateInterval = common.Duration(defaultCacheInterval)
	}
	if a.GuestPermissions == nil {
		a.GuestPermissions = []*role.Permission{}
	}
	err := a.validateClaimRoles()
	if err != nil {
		return err
	}
	return nil
}
