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
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

const (
	GlobalProject = "*"
)

// UsersPermissions contains the mapping of all users and their permissions
// username -> project name or global ("") -> permission list
type UsersPermissions = map[string]map[string][]*v1Role.Permission

func PermissionListHasPermission(permissions []*v1Role.Permission, reqAction v1Role.Action, reqScope v1Role.Scope) bool {
	for _, permission := range permissions {
		for _, action := range permission.Actions {
			if action == reqAction || action == v1Role.WildcardAction {
				for _, scope := range permission.Scopes {
					if scope == reqScope || scope == v1Role.WildcardScope {
						return true
					}
				}
			}
		}
	}
	return false
}

// FindRole is a helper to find a role in a slice
func FindRole(roles []*v1.Role, project string, name string) *v1.Role {
	for _, rle := range roles {
		if rle.Metadata.Name == name && rle.Metadata.Project == project {
			return rle
		}
	}
	return nil
}

// FindGlobalRole is a helper to find a role in a slice
func FindGlobalRole(globalRoles []*v1.GlobalRole, name string) *v1.GlobalRole {
	for _, grle := range globalRoles {
		if grle.Metadata.Name == name {
			return grle
		}
	}
	return nil
}

// AddEntry is appending a project or global permission to user list of permissions
// Empty project equal to Global permission
func AddEntry(usersPermissions UsersPermissions, user string, project string, permission *v1Role.Permission) {
	if _, ok := usersPermissions[user]; !ok {
		usersPermissions[user] = make(map[string][]*v1Role.Permission)
	}

	if _, ok := usersPermissions[user][project]; !ok {
		usersPermissions[user][project] = make([]*v1Role.Permission, 0)
	}
	usersPermissions[user][project] = append(usersPermissions[user][project], permission)
}

// BuildUsersPermissions is building an array mapping of user and their global and project permissions
func BuildUsersPermissions(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO) (UsersPermissions, error) {
	users, err := userDAO.List(&user.Query{})
	if err != nil {
		return nil, err
	}
	roles, err := roleDAO.List(&role.Query{})
	if err != nil {
		return nil, err
	}
	globalRoles, err := globalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return nil, err
	}
	roleBindings, err := roleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return nil, err
	}
	globalRoleBindings, err := globalRoleBindingDAO.List(&globalrolebinding.Query{})
	if err != nil {
		return nil, err
	}

	// Build cache
	usersPermissions := make(UsersPermissions)
	for _, usr := range users {
		for _, globalRoleBinding := range globalRoleBindings {
			if globalRoleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				globalRolePermissions := FindGlobalRole(globalRoles, globalRoleBinding.Spec.Role).Spec.Permissions
				for i := range globalRolePermissions {
					AddEntry(usersPermissions, usr.Metadata.Name, GlobalProject, &globalRolePermissions[i])
				}
			}
		}
	}

	for _, usr := range users {
		for _, roleBinding := range roleBindings {
			if roleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				rolePermissions := FindRole(roles, roleBinding.Metadata.Project, roleBinding.Spec.Role).Spec.Permissions
				for i := range rolePermissions {
					AddEntry(usersPermissions, usr.Metadata.Name, roleBinding.Metadata.Project, &rolePermissions[i])
				}
			}
		}
	}
	return usersPermissions, nil
}
