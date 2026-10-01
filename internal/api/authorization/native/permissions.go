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

package native

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

// usersPermissions contains the mapping of all users and their permission
// username -> project name or global ("") -> permission list
type usersPermissions map[string]map[string][]*v1Role.Permission

// addEntry is appending a project or global permission to the user list of permissions
// Empty project equal to Global permission
func (p usersPermissions) addEntry(user string, project string, permission *v1Role.Permission) {
	if _, ok := p[user]; !ok {
		p[user] = make(map[string][]*v1Role.Permission)
	}

	if _, ok := p[user][project]; !ok {
		p[user][project] = make([]*v1Role.Permission, 0)
	}
	p[user][project] = append(p[user][project], permission)
}

// projectRoleKey identifies a project role.
type projectRoleKey struct {
	project string
	name    string
}

// bindingUsers extracts the users that are subjects of the bindings.
type bindingUsers struct {
	// lastBinding contains every existing user, associated with the last binding (numbered from 1) in which
	// it has been found as a subject. It allows to ignore the subjects that are not existing users,
	// and to ignore a user listed several times in the same binding, without clearing anything between two bindings.
	lastBinding  map[string]int
	bindingCount int
	users        []string
}

func newBindingUsers(users []*v1.User) *bindingUsers {
	lastBinding := make(map[string]int, len(users))
	for _, usr := range users {
		lastBinding[usr.Metadata.Name] = 0
	}
	return &bindingUsers{lastBinding: lastBinding}
}

// of returns the existing users that are subjects of the given binding, without duplicates and in the order of
// the subjects. The returned slice is only valid until the next call.
func (b *bindingUsers) of(spec v1.RoleBindingSpec) []string {
	b.bindingCount++
	b.users = b.users[:0]
	for _, subject := range spec.Subjects {
		if subject.Kind != v1.KindUser {
			continue
		}
		lastBinding, exists := b.lastBinding[subject.Name]
		if !exists || lastBinding == b.bindingCount {
			continue
		}
		b.lastBinding[subject.Name] = b.bindingCount
		b.users = append(b.users, subject.Name)
	}
	return b.users
}

// buildUsersPermissions computes the permissions of every user from the roles and their bindings:
//   - only the subjects that are existing users get permissions, a user listed several times in a binding counts once,
//   - a binding referencing a role that doesn't exist is ignored,
//   - the permissions of a user (for a given project) are ordered like the bindings granting them.
//
// The roles are indexed, and the subjects of each binding are iterated once, so the complexity is linear
// in the number of users, roles, binding subjects and permissions granted.
func buildUsersPermissions(users []*v1.User, globalRoles []*v1.GlobalRole, roles []*v1.Role,
	globalRoleBindings []*v1.GlobalRoleBinding, roleBindings []*v1.RoleBinding) usersPermissions {
	// Index the roles. Like findGlobalRole and findRole, the first role found wins in case of duplicates.
	globalRolesByName := make(map[string]*v1.GlobalRole, len(globalRoles))
	for _, globalRole := range globalRoles {
		if _, exists := globalRolesByName[globalRole.Metadata.Name]; !exists {
			globalRolesByName[globalRole.Metadata.Name] = globalRole
		}
	}
	rolesByKey := make(map[projectRoleKey]*v1.Role, len(roles))
	for _, projectRole := range roles {
		key := projectRoleKey{project: projectRole.Metadata.Project, name: projectRole.Metadata.Name}
		if _, exists := rolesByKey[key]; !exists {
			rolesByKey[key] = projectRole
		}
	}

	permissions := make(usersPermissions)
	subjects := newBindingUsers(users)
	for _, globalRoleBinding := range globalRoleBindings {
		bindingUsers := subjects.of(globalRoleBinding.Spec)
		if len(bindingUsers) == 0 {
			continue
		}
		globalRole, exists := globalRolesByName[globalRoleBinding.Spec.Role]
		if !exists {
			logrus.Warningf("global role %q listed in the global role binding %q does not exist", globalRoleBinding.Spec.Role, globalRoleBinding.Metadata.Name)
			continue
		}
		permissions.addRolePermissions(bindingUsers, v1.WildcardProject, globalRole.Spec.Permissions)
	}
	for _, roleBinding := range roleBindings {
		bindingUsers := subjects.of(roleBinding.Spec)
		if len(bindingUsers) == 0 {
			continue
		}
		projectRole, exists := rolesByKey[projectRoleKey{project: roleBinding.Metadata.Project, name: roleBinding.Spec.Role}]
		if !exists {
			logrus.Warningf("role %q listed in the role binding %s/%s does not exist", roleBinding.Spec.Role, roleBinding.Metadata.Project, roleBinding.Metadata.Name)
			continue
		}
		permissions.addRolePermissions(bindingUsers, roleBinding.Metadata.Project, projectRole.Spec.Permissions)
	}
	return permissions
}

// addRolePermissions grants the permissions of a role to the given users, for the given project.
func (p usersPermissions) addRolePermissions(users []string, project string, rolePermissions []v1Role.Permission) {
	for _, usr := range users {
		for i := range rolePermissions {
			p.addEntry(usr, project, &rolePermissions[i])
		}
	}
}

type cache struct {
	permissions usersPermissions
	globalRoles []*v1.GlobalRole
	roles       []*v1.Role
}

func (c *cache) hasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	usrPermissions, ok := c.permissions[user]
	if !ok {
		return false
	}

	// Checking global perm first
	if requestProject != v1.WildcardProject {
		if globalPermissions, ok := usrPermissions[v1.WildcardProject]; ok {
			if listHasPermission(globalPermissions, requestAction, requestScope) {
				return true
			}
		}
	}

	projectPermissions, ok := usrPermissions[requestProject]
	if !ok {
		return false
	}
	return listHasPermission(projectPermissions, requestAction, requestScope)
}

func listHasPermission(permissions []*v1Role.Permission, requestAction v1Role.Action, requestScope v1Role.Scope) bool {
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
