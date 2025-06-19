// Copyright 2025 The Perses Authors
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
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

func New(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO,
	globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.Config) *Native {
	return &Native{
		cache:                &cache{},
		userDAO:              userDAO,
		roleDAO:              roleDAO,
		roleBindingDAO:       roleBindingDAO,
		globalRoleDAO:        globalRoleDAO,
		globalRoleBindingDAO: globalRoleBindingDAO,
		guestPermissions:     conf.Security.Authorization.GuestPermissions,
	}
}

// Native is expecting a JWT token to extract the user information and validate its permissions.
type Native struct {
	cache                *cache
	userDAO              user.DAO
	roleDAO              role.DAO
	roleBindingDAO       rolebinding.DAO
	globalRoleDAO        globalrole.DAO
	globalRoleBindingDAO globalrolebinding.DAO
	guestPermissions     []*v1Role.Permission
	mutex                sync.RWMutex
}

func (n *Native) IsEnabled() bool {
	return true
}

func (n *Native) GetUser(ctx echo.Context) (any, error) {
	if ctx == nil {
		return nil, nil // No context provided, cannot retrieve user
	}
	token, ok := ctx.Get("user").(*jwt.Token) // by default token is stored under `user` key
	if !ok {
		// In case the token is not present in the context, we are dealing with an anonymous endpoint.
		// We can assume that because there is a middleware that checks the token before calling this method.
		return nil, nil
	}
	return token.Claims, nil
}

func (n *Native) GetUsername(ctx echo.Context) (string, error) {
	usr, _ := n.GetUser(ctx)
	if usr == nil {
		return "", nil // No user found in the context, this is an anonymous endpoint
	}
	return usr.(jwt.Claims).GetSubject()
}

func (n *Native) GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) []string {
	if listHasPermission(n.guestPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}
	}

	username, _ := n.GetUsername(ctx)
	if username == "" {
		// This use case should not happen.
		logrus.Error("failed to get username from context to list the user projects")
		return nil
	}
	projectPermission := n.cache.permissions[username]
	if globalPermissions, ok := projectPermission[v1.WildcardProject]; ok && listHasPermission(globalPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}
	}

	var projects []string
	for project, permList := range projectPermission {
		if project != v1.WildcardProject && listHasPermission(permList, requestAction, requestScope) {
			projects = append(projects, project)
		}
	}
	return projects
}

func (n *Native) HasPermission(ctx echo.Context, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	username, _ := n.GetUsername(ctx)
	if username == "" {
		// if the username is empty, it means we are dealing with an anonymous endpoint.
		return true
	}
	// Checking default permissions
	if ok := listHasPermission(n.guestPermissions, requestAction, requestScope); ok {
		return true
	}
	// Checking cached permissions
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.cache.hasPermission(username, requestAction, requestProject, requestScope)
}

func (n *Native) GetPermissions(ctx echo.Context) map[string][]*v1Role.Permission {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	username, _ := n.GetUsername(ctx)
	if username == "" {
		// This use case should not happen.
		logrus.Warning("No username found in the context, this should not happen in a native RBAC implementation")
		return nil
	}
	userPermissions := make(map[string][]*v1Role.Permission)
	userPermissions[v1.WildcardProject] = n.guestPermissions
	for project, projectPermissions := range n.cache.permissions[username] {
		userPermissions[project] = append(userPermissions[project], projectPermissions...)
	}
	return userPermissions
}

func (n *Native) RefreshPermissions() error {
	permissions, err := n.loadAllPermissions()
	if err != nil {
		return err
	}
	n.mutex.Lock()
	n.cache.permissions = permissions
	n.mutex.Unlock()
	return nil
}

// loadAllPermissions is loading all permissions for all users.
func (n *Native) loadAllPermissions() (usersPermissions, error) {
	users, err := n.userDAO.List(&user.Query{})
	if err != nil {
		return nil, err
	}
	roles, err := n.roleDAO.List(&role.Query{})
	if err != nil {
		return nil, err
	}
	globalRoles, err := n.globalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return nil, err
	}
	roleBindings, err := n.roleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return nil, err
	}
	globalRoleBindings, err := n.globalRoleBindingDAO.List(&globalrolebinding.Query{})
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
					permissionBuild.addEntry(usr.Metadata.Name, v1.WildcardProject, &globalRolePermissions[i])
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
					permissionBuild.addEntry(usr.Metadata.Name, roleBinding.Metadata.Project, &rolePermissions[i])
				}
			}
		}
	}
	return permissionBuild, nil
}
