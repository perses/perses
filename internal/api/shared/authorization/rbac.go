// Copyright 2021 The Perses Authors
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

package authorization

import (
	"fmt"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared/authorization/rbac"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

// CheckUserPermission check if the user has the permission to perform an action.
// Returns an error if the user doesn't have the necessary permission
// If authorization is disabled, it will skip the verification
func CheckUserPermission(rbac RBAC, claims *crypto.JWTCustomClaims, action v1.ActionKind, project string, scope v1.Kind) error {
	if !rbac.IsEnabled() {
		return nil
	}
	if claims == nil {
		return fmt.Errorf("missing token")
	}
	if !rbac.HasPermission(claims.Subject, action, project, scope) {
		return fmt.Errorf("permission denied")
	}
	return nil
}

type RBAC interface {
	IsEnabled() bool
	HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool
	Refresh() error
}

func NewRBAC(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, jwtService crypto.JWT, conf config.Config) (RBAC, error) {

	if !*conf.Security.ActivatePermission {
		return &rbac.DisabledImpl{}, nil
	}

	if *conf.Security.Authorization.ActivateCache {
		newCache, err := rbac.NewCache(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO)
		if err != nil {
			return nil, err
		}

		// TODO: refresh interval if permissions activated
		return &rbac.CacheImpl{
			Cache:                newCache,
			UserDAO:              userDAO,
			RoleDAO:              roleDAO,
			RoleBindingDAO:       roleBindingDAO,
			GlobalRoleDAO:        globalRoleDAO,
			GlobalRoleBindingDAO: globalRoleBindingDAO,
			JwtService:           jwtService,
			GuestPermissions:     conf.Security.Authorization.GuestPermissions,
		}, nil
	}

	return &rbac.BasicImpl{
		UserDAO:              userDAO,
		RoleDAO:              roleDAO,
		RoleBindingDAO:       roleBindingDAO,
		GlobalRoleDAO:        globalRoleDAO,
		GlobalRoleBindingDAO: globalRoleBindingDAO,
		JwtService:           jwtService,
		GuestPermissions:     conf.Security.Authorization.GuestPermissions,
	}, nil
}
