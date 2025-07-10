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
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

func New(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO,
	globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.Config) (*native, error) {
	key, err := hex.DecodeString(string(conf.Security.EncryptionKey))
	if err != nil {
		return nil, err
	}
	return &native{
		cache:                &cache{},
		userDAO:              userDAO,
		roleDAO:              roleDAO,
		roleBindingDAO:       roleBindingDAO,
		globalRoleDAO:        globalRoleDAO,
		globalRoleBindingDAO: globalRoleBindingDAO,
		guestPermissions:     conf.Security.Authorization.Provider.Native.GuestPermissions,
		accessKey:            key,
	}, err
}

// native is expecting a JWT token to extract the user information and validate its permissions.
type native struct {
	// The key used to sign the JWT token, it is expected to be the same as the one used in the crypto package.
	accessKey []byte
	// cache is used to store in memory the permissions of all users.
	cache                *cache
	userDAO              user.DAO
	roleDAO              role.DAO
	roleBindingDAO       rolebinding.DAO
	globalRoleDAO        globalrole.DAO
	globalRoleBindingDAO globalrolebinding.DAO
	guestPermissions     []*v1Role.Permission
	// mutex is used to protect the cache from concurrent access.
	mutex sync.RWMutex
}

func (n *native) IsEnabled() bool {
	return true
}

func (n *native) GetUser(ctx echo.Context) (any, error) {
	// Context can be nil when the function is called outside the request context.
	// For example, the provisioning service is calling every service without any context.
	if ctx == nil {
		return nil, nil // No context provided, cannot retrieve user
	}
	// Verify if it is an anonymous endpoint
	if utils.IsAnonymous(ctx) {
		return nil, nil
	}
	// At this point, we are sure that the context is not nil and the user is not anonymous.
	// The user is expected to be set in the context by the middleware.
	token, ok := ctx.Get("user").(*jwt.Token) // by default token is stored under `user` key
	if !ok {
		return nil, apiInterface.UnauthorizedError
	}
	return token.Claims, nil
}

func (n *native) GetUsername(ctx echo.Context) (string, error) {
	usr, err := n.GetUser(ctx)
	if err != nil {
		return "", err
	}
	if usr == nil {
		return "", nil // No user found in the context, this is an anonymous endpoint
	}
	return usr.(jwt.Claims).GetSubject()
}

func (n *native) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
	jwtMiddlewareConfig := echojwt.Config{
		Skipper: skipper,
		BeforeFunc: func(c echo.Context) {
			// Merge the JWT cookies if they exist to create the token,
			// and then set the header Authorization with the complete token.
			payloadCookie, err := c.Cookie(crypto.CookieKeyJWTPayload)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", crypto.CookieKeyJWTPayload)
				return
			}
			signatureCookie, err := c.Cookie(crypto.CookieKeyJWTSignature)
			if errors.Is(err, http.ErrNoCookie) {
				logrus.Tracef("cookie %q not found", crypto.CookieKeyJWTSignature)
				return
			}
			c.Request().Header.Set("Authorization", fmt.Sprintf("Bearer %s.%s", payloadCookie.Value, signatureCookie.Value))
		},
		NewClaimsFunc: func(_ echo.Context) jwt.Claims {
			return &jwt.RegisteredClaims{}
		},
		SigningMethod: jwt.SigningMethodHS512.Name,
		SigningKey:    n.accessKey,
	}
	return echojwt.WithConfig(jwtMiddlewareConfig)
}

func (n *native) GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) ([]string, error) {
	if ListHasPermission(n.guestPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}, nil
	}

	username, err := n.GetUsername(ctx)
	if err != nil {
		return nil, err
	}
	if username == "" {
		// This method should not be called if the endpoint is anonymous or the username is not found.
		logrus.Error("failed to get username from context to list the user projects")
		return nil, apiInterface.InternalError
	}
	projectPermission := n.cache.permissions[username]
	if globalPermissions, ok := projectPermission[v1.WildcardProject]; ok && ListHasPermission(globalPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}, nil
	}

	var projects []string
	for project, permList := range projectPermission {
		if project != v1.WildcardProject && ListHasPermission(permList, requestAction, requestScope) {
			projects = append(projects, project)
		}
	}
	return projects, nil
}

func (n *native) HasPermission(ctx echo.Context, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// If the context is nil, it means the function is called internally without a request context.
	// And in this case, we assume we want to bypass the authorization check.
	if ctx == nil {
		return true
	}
	if utils.IsAnonymous(ctx) {
		// If the endpoint is anonymous, we allow the request to pass through.
		return true
	}
	username, err := n.GetUsername(ctx)
	if err != nil {
		logrus.WithError(err).Error("failed to get username from context to check the user permissions")
		return false // If we cannot get the username, we cannot check the permissions
	}
	if username == "" {
		// At this point, as the endpoint is not anonymous, we should have a username in the context.
		// If we don't, it means something went wrong, and we cannot check the permissions.
		logrus.Error("no username found in the context, this should not happen in a native RBAC implementation")
		return false // No username found, cannot check permissions
	}
	// Checking default permissions
	if ok := ListHasPermission(n.guestPermissions, requestAction, requestScope); ok {
		return true
	}
	// Checking cached permissions
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.cache.hasPermission(username, requestAction, requestProject, requestScope)
}

func (n *native) GetPermissions(ctx echo.Context) (map[string][]*v1Role.Permission, error) {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	username, err := n.GetUsername(ctx)
	if err != nil {
		return nil, err
	}
	if username == "" {
		// This use case should not happen.
		logrus.Error("No username found in the context, this should not happen in a native RBAC implementation")
		return nil, apiInterface.InternalError
	}
	userPermissions := make(map[string][]*v1Role.Permission)
	userPermissions[v1.WildcardProject] = n.guestPermissions
	for project, projectPermissions := range n.cache.permissions[username] {
		userPermissions[project] = append(userPermissions[project], projectPermissions...)
	}
	return userPermissions, nil
}

func (n *native) RefreshPermissions() error {
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
func (n *native) loadAllPermissions() (usersPermissions, error) {
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
