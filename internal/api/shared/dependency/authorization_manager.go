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

package dependency

import (
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type AuthorizationManager interface {
	HasPermission(user string, action v1.ActionKind, kind v1.Kind) bool
	RefreshCache()
}

type rbacCache struct {
	users              []*v1.User
	roles              []*v1.Role
	globalRoles        []*v1.GlobalRole
	roleBindings       []*v1.RoleBinding
	globalRoleBindings []*v1.GlobalRoleBinding
	// user -> project / * (global) -> perms
	userPermissions map[string]map[string][]*v1.Permission
}

func (r rbacCache) AddEntry(user string, project string, permission *v1.Permission) {
	if _, ok := r.userPermissions[user]; !ok {
		r.userPermissions[user] = make(map[string][]*v1.Permission)
	}

	if _, ok := r.userPermissions[user][project]; !ok { // TODO: check val ?
		r.userPermissions[user][project] = make([]*v1.Permission, 0)
	}
	r.userPermissions[user][project] = append(r.userPermissions[user][project], permission)
}

func (r rbacCache) FindRole(project string, name string) *v1.Role {
	for _, rle := range r.roles {
		if rle.Metadata.Name == name && rle.Metadata.Project == project {
			return rle
		}
	}
	return nil
}

func (r rbacCache) FindGlobalRole(name string) *v1.GlobalRole {
	for _, grle := range r.globalRoles {
		if grle.Metadata.Name == name {
			return grle
		}
	}
	return nil
}

type authorization struct {
	AuthorizationManager
	cache rbacCache
}

func computeRBACCache(dao PersistenceManager) (*rbacCache, error) {
	var cache rbacCache
	// Retrieve users, roles, globalroles, rolebindings and globalrolebindings
	users, err := dao.GetUser().List(user.Query{})
	if err != nil {
		return nil, err
	}
	cache.users = users

	roles, err := dao.GetRole().List(role.Query{})
	if err != nil {
		return nil, err
	}
	cache.roles = roles

	globalRoles, err := dao.GetGlobalRole().List(globalrole.Query{})
	if err != nil {
		return nil, err
	}
	cache.globalRoles = globalRoles

	roleBindings, err := dao.GetRoleBinding().List(rolebinding.Query{})
	if err != nil {
		return nil, err
	}
	cache.roleBindings = roleBindings

	globalRoleBindings, err := dao.GetGlobalRoleBinding().List(globalrolebinding.Query{})
	if err != nil {
		return nil, err
	}
	cache.globalRoleBindings = globalRoleBindings

	// Build cache
	cache.userPermissions = make(map[string]map[string][]*v1.Permission)
	for _, usr := range users {
		for _, globalRoleBinding := range globalRoleBindings {
			if globalRoleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				for _, permission := range cache.FindGlobalRole(globalRoleBinding.Spec.Role).Spec.Permissions { // TODO: Check nil
					cache.AddEntry(usr.Metadata.Name, "", &permission)
				}
			}
		}
	}

	for _, usr := range users {
		for _, roleBinding := range roleBindings {
			if roleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				for _, permission := range cache.FindRole(roleBinding.Metadata.Project, roleBinding.Spec.Role).Spec.Permissions { // TODO: Check nil
					cache.AddEntry(usr.Metadata.Name, roleBinding.Metadata.Project, &permission)
				}
			}
		}
	}

	return &cache, nil

}

func NewAuthorizationManager(dao PersistenceManager, conf config.Config) (*AuthorizationManager, error) {
	// Init cache

	// Init auto refresh cache task
	return nil, nil
}

func (a *authorization) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool {
	// Checking global perm first
	userPermissions, ok := a.cache.userPermissions[user]
	if !ok {
		return false
	}

	// Perm checked at project level but perm can be found in a global role
	if len(reqProject) > 0 {
		permissions, ok := userPermissions[""]
		if !ok {
			return false
		}
		
		// Check user perm
		if ok := HasPermission(permissions, reqAction, reqProject, reqScope); ok {
			return true
		}
	}

	permissions, ok := userPermissions[reqProject]
	if !ok {
		return false
	}
	return HasPermission(permissions, reqAction, reqProject, reqScope)
}

func HasPermission(permissions []*v1.Permission, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool {
	for _, permission := range permissions {
		for _, action := range permission.Actions {
			if action == reqAction || action == v1.KindWildcard {
				for _, scope := range permission.Scopes {
					if scope == reqScope || scope == "*" { // TODO: wildcard var
						return true
					}
				}
			}
		}
	}
	return false
}
