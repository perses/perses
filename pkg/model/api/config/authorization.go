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
	"slices"
	"time"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

var (
	defaultCacheInterval = 30 * time.Second
)

type Assignment struct {
	Name        string   `json:"name" yaml:"name"`
	RoleClaims  []string `json:"role_claims,omitempty" yaml:"role_claims,omitempty"`
	GroupClaims []string `json:"group_claims,omitempty" yaml:"group_claims,omitempty"`
}

func (a *Assignment) CheckRoleClaim(userRoleClaims []string) bool {
	for _, urc := range userRoleClaims {
		ok := slices.Contains(a.RoleClaims, urc)
		if ok {
			return true
		}
	}
	return false
}

func (a *Assignment) CheckGroupClaim(userGroupClaims []string) bool {
	for _, urc := range userGroupClaims {
		ok := slices.Contains(a.GroupClaims, urc)
		if ok {
			return true
		}
	}
	return false
}

type RoleAssignment struct {
	Assignment
	Project string `json:"project" yaml:"project"`
	Role    *v1.Role
}

type GlobalRoleAssignment struct {
	Assignment
	GlobalRole *v1.GlobalRole
}

type ClaimsMappingConfig struct {
	RoleClaimsPath    string                  `json:"role_claims_path,omitempty" yaml:"role_claims_path,omitempty"`
	GroupClaimsPath   string                  `json:"group_claims_path,omitempty" yaml:"group_claims_path,omitempty"`
	RoleMapping       []*RoleAssignment       `json:"role_mapping,omitempty" yaml:"role_mapping,omitempty"`
	GlobalRoleMapping []*GlobalRoleAssignment `json:"global_role_mapping,omitempty" yaml:"global_role_mapping,omitempty"`
}

type AuthorizationConfig struct {
	// CheckLatestUpdateInterval that checks if the RBAC cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*v1Role.Permission `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
	// TODO: documentation
	ClaimsMappingConfig *ClaimsMappingConfig `json:"claims_mapping_config,omitempty" yaml:"claims_mapping_config,omitempty"`
}

func (a *AuthorizationConfig) Verify() error {
	if a.CheckLatestUpdateInterval <= 0 {
		a.CheckLatestUpdateInterval = common.Duration(defaultCacheInterval)
	}
	if a.GuestPermissions == nil {
		a.GuestPermissions = []*v1Role.Permission{}
	}
	return nil
}
