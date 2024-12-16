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
	"github.com/sirupsen/logrus"
)

const (
	GlobalProject = "*"
)

// usersPermissions contains the mapping of all users and their permission
// username -> project name or global ("") -> permission list
type usersPermissions = map[string]map[string][]*v1Role.Permission

func permissionListHasPermission(permissions []*v1Role.Permission, requestAction v1Role.Action, requestScope v1Role.Scope) bool {
	for _, permission := range permissions {
		for _, action := range permission.Actions {
			if action == requestAction || action == v1Role.WildcardAction {
				for _, scope := range permission.Scopes {
					if scope == requestScope || scope == v1Role.WildcardScope {
						return true
					}
				}
			}
		}
	}
	return false
}

// findRole is a helper to find a role in a slice
func findRole(roles []*v1.Role, project string, name string) *v1.Role {
	for _, rle := range roles {
		if rle.Metadata.Name == name && rle.Metadata.Project == project {
			return rle
		}
	}
	return nil
}

// findGlobalRole is a helper to find a role in a slice
func findGlobalRole(globalRoles []*v1.GlobalRole, name string) *v1.GlobalRole {
	for _, grle := range globalRoles {
		if grle.Metadata.Name == name {
			return grle
		}
	}
	return nil
}

// addEntry is appending a project or global permission to the user list of permissions
// Empty project equal to Global permission
func addEntry(usersPermissions usersPermissions, user string, project string, permission *v1Role.Permission) {
	if _, ok := usersPermissions[user]; !ok {
		usersPermissions[user] = make(map[string][]*v1Role.Permission)
	}

	if _, ok := usersPermissions[user][project]; !ok {
		usersPermissions[user][project] = make([]*v1Role.Permission, 0)
	}
	usersPermissions[user][project] = append(usersPermissions[user][project], permission)
}

// buildUsersPermissions is building an array mapping of user and their global and project permissions
func (r *cacheImpl) buildUsersPermissions() (usersPermissions, error) {
	users, err := r.userDAO.List(&user.Query{})
	if err != nil {
		return nil, err
	}
	roles, err := r.roleDAO.List(&role.Query{})
	if err != nil {
		return nil, err
	}
	globalRoles, err := r.globalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return nil, err
	}
	roleBindings, err := r.roleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return nil, err
	}
	globalRoleBindings, err := r.globalRoleBindingDAO.List(&globalrolebinding.Query{})
	if err != nil {
		return nil, err
	}

	// Build cache
	permissionBuild := make(usersPermissions)
	for _, usr := range users {
		for _, globalRoleBinding := range globalRoleBindings {
			if globalRoleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				globalRole := findGlobalRole(globalRoles, globalRoleBinding.Spec.Role)
				if globalRole == nil {
					logrus.Warningf("global role %q listed in the global role binding %q does not exist", globalRoleBinding.Spec.Role, globalRoleBinding.Metadata.Name)
					continue
				}
				globalRolePermissions := globalRole.Spec.Permissions
				for i := range globalRolePermissions {
					addEntry(permissionBuild, usr.Metadata.Name, GlobalProject, &globalRolePermissions[i])
				}
			}
		}
	}

	for _, usr := range users {
		for _, roleBinding := range roleBindings {
			if roleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				projectRole := findRole(roles, roleBinding.Metadata.Project, roleBinding.Spec.Role)
				if projectRole == nil {
					logrus.Warningf("role %q listed in the role binding %s/%s does not exist", roleBinding.Spec.Role, roleBinding.Metadata.Project, roleBinding.Metadata.Name)
					continue
				}
				rolePermissions := projectRole.Spec.Permissions
				for i := range rolePermissions {
					addEntry(permissionBuild, usr.Metadata.Name, roleBinding.Metadata.Project, &rolePermissions[i])
				}
			}
		}
	}
	return permissionBuild, nil
}
