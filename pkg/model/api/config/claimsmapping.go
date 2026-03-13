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

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Assignment struct {
	Name       string   `json:"name" yaml:"name"`
	RoleClaims []string `json:"role_claims,omitempty" yaml:"role_claims,omitempty"`
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
	AuthClaimsPath    string                  `json:"auth_claims_path,omitempty" yaml:"auth_claims_path,omitempty"`
	RoleMapping       []*RoleAssignment       `json:"role_mapping,omitempty" yaml:"role_mapping,omitempty"`
	GlobalRoleMapping []*GlobalRoleAssignment `json:"global_role_mapping,omitempty" yaml:"global_role_mapping,omitempty"`
}
