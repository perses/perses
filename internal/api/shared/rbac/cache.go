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
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type cache struct {
	permissions usersPermissions
}

func (c *cache) hasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	usrPermissions, ok := c.permissions[user]
	if !ok {
		return false
	}

	// Checking global perm first
	if requestProject != GlobalProject {
		if globalPermissions, ok := usrPermissions[GlobalProject]; ok {
			if permissionListHasPermission(globalPermissions, requestAction, requestScope) {
				return true
			}
		}
	}

	projectPermissions, ok := usrPermissions[requestProject]
	if !ok {
		return false
	}
	return permissionListHasPermission(projectPermissions, requestAction, requestScope)
}

type cacheImpl struct {
	cache                *cache
	userDAO              user.DAO
	roleDAO              role.DAO
	roleBindingDAO       rolebinding.DAO
	globalRoleDAO        globalrole.DAO
	globalRoleBindingDAO globalrolebinding.DAO
	guestPermissions     []*v1Role.Permission
}

func (r *cacheImpl) IsEnabled() bool {
	return true
}

func (r *cacheImpl) HasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// Checking default permissions
	if ok := permissionListHasPermission(r.guestPermissions, requestAction, requestScope); ok {
		return true
	}
	// Checking cached permissions
	return r.cache.hasPermission(user, requestAction, requestProject, requestScope)
}

func (r *cacheImpl) Refresh() error {
	permissions, err := buildUsersPermissions(r.userDAO, r.roleDAO, r.roleBindingDAO, r.globalRoleDAO, r.globalRoleBindingDAO)
	if err != nil {
		return err
	}
	r.cache.permissions = permissions
	return nil
}
