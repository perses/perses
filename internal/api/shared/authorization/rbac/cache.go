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
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type CacheImpl struct {
	Cache                *Cache
	UserDAO              user.DAO
	RoleDAO              role.DAO
	RoleBindingDAO       rolebinding.DAO
	GlobalRoleDAO        globalrole.DAO
	GlobalRoleBindingDAO globalrolebinding.DAO
	JwtService           crypto.JWT
	GuestPermissions     []*v1Role.Permission
}

func (r *CacheImpl) IsEnabled() bool {
	return true
}

func (r *CacheImpl) HasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// Checking default permissions
	if ok := permissionListHasPermission(r.GuestPermissions, requestAction, requestScope); ok {
		return true
	}
	// Checking cached permissions
	return r.Cache.HasPermission(user, requestAction, requestProject, requestScope)
}

func (r *CacheImpl) Refresh() error {
	usersPermissions, err := buildUsersPermissions(r.UserDAO, r.RoleDAO, r.RoleBindingDAO, r.GlobalRoleDAO, r.GlobalRoleBindingDAO)
	if err != nil {
		return err
	}
	r.Cache.UsersPermissions = usersPermissions
	return nil
}

func NewCache(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO) (*Cache, error) {
	usersPermissions, err := buildUsersPermissions(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO)
	if err != nil {
		return nil, err
	}

	return &Cache{
		UsersPermissions: usersPermissions,
	}, nil
}

type Cache struct {
	UsersPermissions usersPermissions
}

func (r Cache) HasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	usersPermissions, ok := r.UsersPermissions[user]
	if !ok {
		return false
	}

	// Checking global perm first
	if requestProject != GlobalProject {
		globalPermissions, ok := usersPermissions[GlobalProject]
		if ok {
			if ok := permissionListHasPermission(globalPermissions, requestAction, requestScope); ok {
				return true
			}
		}
	}

	projectPermissions, ok := usersPermissions[requestProject]
	if !ok {
		return false
	}
	return permissionListHasPermission(projectPermissions, requestAction, requestScope)
}
