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
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"slices"
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
		claimMappings:        buildClaimMappings(conf),
		accessKey:            key,
	}, err
}

// providerKey uniquely identifies an OAuth/OIDC provider by kind and slug_id.
type providerKey struct {
	kind string
	id   string
}

// claimRoleMapping holds a single resolved mapping from a claim value to a Perses role.
type claimRoleMapping struct {
	claimName  string
	claimValue string
	roleName   string
	// project is empty for GlobalRole mappings; non-empty for project-scoped Role mappings.
	project string
}

// buildClaimMappings indexes all claim→role mappings from the config for fast per-request lookup.
func buildClaimMappings(conf config.Config) map[providerKey][]claimRoleMapping {
	result := make(map[providerKey][]claimRoleMapping)
	for _, p := range conf.Security.Authentication.Providers.OIDC {
		key := providerKey{kind: utils.AuthnKindOIDC, id: p.SlugID}
		for _, cc := range p.Claims {
			for _, m := range cc.Mappings {
				result[key] = append(result[key], claimRoleMapping{
					claimName:  cc.ClaimName,
					claimValue: m.ClaimValue,
					roleName:   m.RoleName,
					project:    m.Project,
				})
			}
		}
	}
	for _, p := range conf.Security.Authentication.Providers.OAuth {
		key := providerKey{kind: utils.AuthnKindOAuth, id: p.SlugID}
		for _, cc := range p.Claims {
			for _, m := range cc.Mappings {
				result[key] = append(result[key], claimRoleMapping{
					claimName:  cc.ClaimName,
					claimValue: m.ClaimValue,
					roleName:   m.RoleName,
					project:    m.Project,
				})
			}
		}
	}
	return result
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
	// claimMappings maps provider keys to their claim→role mappings, indexed at startup from config.
	claimMappings map[providerKey][]claimRoleMapping
	// mutex is used to protect the cache from concurrent access.
	mutex sync.RWMutex
}

func (n *native) IsEnabled() bool {
	return true
}

func (n *native) IsNativeAuthz() bool {
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
	return usr.(*crypto.JWTClaims).GetSubject()
}

func (n *native) GetProviderInfo(ctx echo.Context) (crypto.ProviderInfo, error) {
	usr, err := n.GetUser(ctx)
	if err != nil {
		return crypto.ProviderInfo{}, err
	}
	if usr == nil {
		return crypto.ProviderInfo{}, nil // No user found in the context, this is an anonymous endpoint
	}
	return usr.(*crypto.JWTClaims).ProviderInfo, nil
}

func (n *native) GetPublicUser(ctx echo.Context) (*v1.PublicUser, error) {
	username, err := n.GetUsername(ctx)
	if err != nil {
		return nil, err
	}

	user, err := n.userDAO.Get(username)
	if err != nil {
		return nil, err
	}

	return v1.NewPublicUser(user), nil
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
			return &crypto.JWTClaims{}
		},
		SigningMethod: jwt.SigningMethodHS512.Name,
		SigningKey:    n.accessKey,
	}
	return echojwt.WithConfig(jwtMiddlewareConfig)
}

func (n *native) GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) ([]string, error) {
	if listHasPermission(n.guestPermissions, requestAction, requestScope) {
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

	// Claim-based check: if wildcard permission found via claims, short-circuit.
	usr, _ := n.GetUser(ctx)
	if claims, ok := usr.(*crypto.JWTClaims); ok {
		claimPerms := n.claimPermissions(claims)
		if listHasPermission(claimPerms[v1.WildcardProject], requestAction, requestScope) {
			return []string{v1.WildcardProject}, nil
		}
		var claimProjects []string
		for project, permList := range claimPerms {
			if project != v1.WildcardProject && listHasPermission(permList, requestAction, requestScope) {
				claimProjects = append(claimProjects, project)
			}
		}
		if len(claimProjects) > 0 {
			return claimProjects, nil
		}
	}

	n.mutex.RLock()
	defer n.mutex.RUnlock()
	projectPermission := n.cache.permissions[username]
	if globalPermissions, ok := projectPermission[v1.WildcardProject]; ok && listHasPermission(globalPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}, nil
	}

	var projects []string
	for project, permList := range projectPermission {
		if project != v1.WildcardProject && listHasPermission(permList, requestAction, requestScope) {
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
	if ok := listHasPermission(n.guestPermissions, requestAction, requestScope); ok {
		return true
	}
	// Claim-based check (stateless, from JWT)
	usr, _ := n.GetUser(ctx)
	if claims, ok := usr.(*crypto.JWTClaims); ok {
		claimPerms := n.claimPermissions(claims)
		if listHasPermission(claimPerms[v1.WildcardProject], requestAction, requestScope) {
			return true
		}
		if requestProject != v1.WildcardProject && listHasPermission(claimPerms[requestProject], requestAction, requestScope) {
			return true
		}
	}
	// Checking cached permissions
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.cache.hasPermission(username, requestAction, requestProject, requestScope)
}

// For native auth, creating a project requires a global permission.
func (n *native) HasCreateProjectPermission(ctx echo.Context, projectName string) bool {
	return n.HasPermission(ctx, v1Role.CreateAction, v1.WildcardProject, v1Role.ProjectScope)
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
	// Merge claim-based permissions
	usr, _ := n.GetUser(ctx)
	if claims, ok := usr.(*crypto.JWTClaims); ok {
		for project, perms := range n.claimPermissions(claims) {
			userPermissions[project] = append(userPermissions[project], perms...)
		}
	}
	return userPermissions, nil
}

func (n *native) RefreshPermissions() error {
	permissions, globalRoles, roles, err := n.loadAllPermissions()
	if err != nil {
		return err
	}
	n.mutex.Lock()
	n.cache.permissions = permissions
	n.cache.globalRoles = globalRoles
	n.cache.roles = roles
	n.mutex.Unlock()
	return nil
}

// loadAllPermissions is loading all permissions for all users.
func (n *native) loadAllPermissions() (usersPermissions, []*v1.GlobalRole, []*v1.Role, error) {
	users, err := n.userDAO.List(&user.Query{})
	if err != nil {
		return nil, nil, nil, err
	}
	roles, err := n.roleDAO.List(&role.Query{})
	if err != nil {
		return nil, nil, nil, err
	}
	globalRoles, err := n.globalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return nil, nil, nil, err
	}
	roleBindings, err := n.roleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return nil, nil, nil, err
	}
	globalRoleBindings, err := n.globalRoleBindingDAO.List(&globalrolebinding.Query{})
	if err != nil {
		return nil, nil, nil, err
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
	return permissionBuild, globalRoles, roles, nil
}

// claimPermissions resolves the permissions granted by a user's PersistedClaims based on
// the provider's claim→role mappings defined in the config.
// Returns a map of project → permissions (using v1.WildcardProject for GlobalRole mappings).
// Returns nil when no matching mappings are found.
func (n *native) claimPermissions(claims *crypto.JWTClaims) map[string][]*v1Role.Permission {
	if claims == nil || len(claims.PersistedClaims) == 0 {
		return nil
	}
	key := providerKey{kind: claims.ProviderKind, id: claims.ProviderID}
	mappings, ok := n.claimMappings[key]
	if !ok {
		return nil
	}

	result := make(map[string][]*v1Role.Permission)
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	for _, m := range mappings {
		claimValues := claims.PersistedClaims[m.claimName]
		if !slices.Contains(claimValues, m.claimValue) {
			continue
		}
		if m.project == "" {
			// GlobalRole mapping
			grole := findGlobalRole(n.cache.globalRoles, m.roleName)
			if grole == nil {
				logrus.Warningf("claim mapping references unknown GlobalRole %q", m.roleName)
				continue
			}
			for i := range grole.Spec.Permissions {
				result[v1.WildcardProject] = append(result[v1.WildcardProject], &grole.Spec.Permissions[i])
			}
		} else {
			// Project-scoped Role mapping
			prole := findRole(n.cache.roles, m.project, m.roleName)
			if prole == nil {
				logrus.Warningf("claim mapping references unknown Role %q in project %q", m.roleName, m.project)
				continue
			}
			for i := range prole.Spec.Permissions {
				result[m.project] = append(result[m.project], &prole.Spec.Permissions[i])
			}
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}
