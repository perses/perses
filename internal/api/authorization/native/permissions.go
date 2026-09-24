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
	"slices"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

// usersPermissions contains the mapping of all users and their permission
// username -> project name or global ("") -> permission list
type usersPermissions map[string]map[string][]*v1Role.Permission

// mergePermissions returns a new permission map containing the permissions of both base and
// additional, concatenating the permission lists that share the same project.
// Neither input map is modified.
func mergePermissions(base, additional map[string][]*v1Role.Permission) map[string][]*v1Role.Permission {
	merged := make(map[string][]*v1Role.Permission, len(base)+len(additional))
	for project, permissions := range base {
		merged[project] = slices.Clone(permissions)
	}
	for project, permissions := range additional {
		merged[project] = slices.Concat(merged[project], permissions)
	}
	return merged
}

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

type cache struct {
	permissions usersPermissions
	globalRoles []*v1.GlobalRole
	roles       []*v1.Role
}

func (c *cache) hasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// The wildcard user ("*") applies to every user, so its permissions are merged with
	// the user-specific ones.
	userPermissions := mergePermissions(c.permissions[v1.WildcardUser], c.permissions[user])
	if len(userPermissions) == 0 {
		return false
	}

	// Checking global perm first
	if requestProject != v1.WildcardProject {
		if globalPermissions, ok := userPermissions[v1.WildcardProject]; ok {
			if listHasPermission(globalPermissions, requestAction, requestScope) {
				return true
			}
		}
	}

	projectPermissions, ok := userPermissions[requestProject]
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
