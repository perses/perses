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

package rbac

import (
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type BasicImpl struct {
	UserDAO              user.DAO
	RoleDAO              role.DAO
	RoleBindingDAO       rolebinding.DAO
	GlobalRoleDAO        globalrole.DAO
	GlobalRoleBindingDAO globalrolebinding.DAO
	JwtService           crypto.JWT
	GuestPermissions     []*v1.Permission
}

func (r BasicImpl) IsEnabled() bool {
	return true
}

func (r BasicImpl) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool {
	// Checking default permissions
	if ok := PermissionListHasPermission(r.GuestPermissions, reqAction, reqScope); ok {
		return true
	}

	roles, err := r.RoleDAO.List(&role.Query{})
	if err != nil {
		return false
	}
	globalRoles, err := r.GlobalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return false
	}
	roleBindings, err := r.RoleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return false
	}
	globalRoleBindings, err := r.GlobalRoleBindingDAO.List(&globalrolebinding.Query{})
	if err != nil {
		return false
	}

	// Build cache
	usersPermissions := make(UsersPermissions)
	for _, globalRoleBinding := range globalRoleBindings {
		if globalRoleBinding.Spec.Has(v1.KindUser, user) {
			globalRolePermissions := FindGlobalRole(globalRoles, globalRoleBinding.Spec.Role).Spec.Permissions
			for i := range globalRolePermissions {
				AddEntry(usersPermissions, user, GlobalProject, &globalRolePermissions[i])
			}
		}
	}

	for _, roleBinding := range roleBindings {
		if roleBinding.Spec.Has(v1.KindUser, user) {
			rolePermissions := FindRole(roles, roleBinding.Metadata.Project, roleBinding.Spec.Role).Spec.Permissions
			for i := range rolePermissions {
				AddEntry(usersPermissions, user, roleBinding.Metadata.Project, &rolePermissions[i])
			}
		}
	}

	// Checking global perm first
	if len(reqProject) > 0 {
		globalPermissions, ok := usersPermissions[user][GlobalProject]
		if !ok {
			return false
		}

		// Check user perm
		if ok := PermissionListHasPermission(globalPermissions, reqAction, reqScope); ok {
			return true
		}
	}

	// Retrieving user permissions
	projectPermissions, ok := usersPermissions[user][reqProject]
	if !ok {
		return false
	}
	return PermissionListHasPermission(projectPermissions, reqAction, reqScope)
}

func (r BasicImpl) Refresh() error {
	return nil
}
