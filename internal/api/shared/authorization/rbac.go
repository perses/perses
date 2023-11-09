package authorization

import (
	"fmt"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

func CheckUserPermission(rbac RBAC, claims *crypto.JWTCustomClaims, action v1.ActionKind, project string, scope v1.Kind) error {
	if !rbac.IsEnabled() {
		return nil
	}
	if claims == nil {
		return fmt.Errorf("missing token")
	}
	if !rbac.HasPermission(claims.Subject, action, project, scope) {
		return fmt.Errorf("permission denied")
	}
	return nil
}

func findRole(roles []*v1.Role, project string, name string) *v1.Role {
	for _, rle := range roles {
		if rle.Metadata.Name == name && rle.Metadata.Project == project {
			return rle
		}
	}
	return nil
}

func findGlobalRole(globalRoles []*v1.GlobalRole, name string) *v1.GlobalRole { // TODO: generic
	for _, grle := range globalRoles {
		if grle.Metadata.Name == name {
			return grle
		}
	}
	return nil
}

func addEntry(userPermissions userPermissions, user string, project string, permission *v1.Permission) {
	if _, ok := userPermissions[user]; !ok {
		userPermissions[user] = make(map[string][]*v1.Permission)
	}

	if _, ok := userPermissions[user][project]; !ok { // TODO: check val ?
		userPermissions[user][project] = make([]*v1.Permission, 0)
	}
	userPermissions[user][project] = append(userPermissions[user][project], permission)
}

func buildUserPermissions(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO) (userPermissions, error) {
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
	userPermissions := make(userPermissions)
	for _, usr := range users {
		for _, globalRoleBinding := range globalRoleBindings {
			if globalRoleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				for _, permission := range findGlobalRole(globalRoles, globalRoleBinding.Spec.Role).Spec.Permissions { // TODO: Check nil
					addEntry(userPermissions, usr.Metadata.Name, "", &permission)
				}
			}
		}
	}

	for _, usr := range users {
		for _, roleBinding := range roleBindings {
			if roleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				for _, permission := range findRole(roles, roleBinding.Metadata.Project, roleBinding.Spec.Role).Spec.Permissions { // TODO: Check nil
					addEntry(userPermissions, usr.Metadata.Name, roleBinding.Metadata.Project, &permission)
				}
			}
		}
	}
	return userPermissions, nil
}

type RBAC interface {
	IsEnabled() bool
	HasPermission(user string, action v1.ActionKind, project string, kind v1.Kind) bool
	Refresh() error
}

func NewRBAC(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, jwtService crypto.JWT, conf config.Config) (RBAC, error) {
	var cache *Cache
	if *conf.Security.ActivatePermission {
		newCache, err := NewCache(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO, *conf.Security.Authorization)
		if err != nil {
			return nil, err
		}
		cache = newCache
	}

	// TODO: refresh interval if permissions activated

	return &rbacImpl{
		cache:                cache,
		userDAO:              userDAO,
		roleDAO:              roleDAO,
		roleBindingDAO:       roleBindingDAO,
		globalRoleDAO:        globalRoleDAO,
		globalRoleBindingDAO: globalRoleBindingDAO,
		jwtService:           jwtService,
		isEnabled:            *conf.Security.ActivatePermission,
	}, nil
}

type rbacImpl struct {
	cache                *Cache
	userDAO              user.DAO
	roleDAO              role.DAO
	roleBindingDAO       rolebinding.DAO
	globalRoleDAO        globalrole.DAO
	globalRoleBindingDAO globalrolebinding.DAO
	jwtService           crypto.JWT
	isEnabled            bool
	// TODO: refresh async.SimpleTask
}

func (r rbacImpl) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqKind v1.Kind) bool {
	return r.cache.HasPermission(user, reqAction, reqProject, reqKind)
}

func (r rbacImpl) Refresh() error {
	userPermissions, err := buildUserPermissions(r.userDAO, r.roleDAO, r.roleBindingDAO, r.globalRoleDAO, r.globalRoleBindingDAO)
	if err != nil {
		return err
	}
	r.cache.userPermissions = userPermissions
	return nil
}

func (r rbacImpl) IsEnabled() bool {
	return r.isEnabled
}

func NewCache(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.AuthorizationConfig) (*Cache, error) {
	var cache Cache

	cache.guestPermissions = conf.GuestPermissions
	userPermissions, err := buildUserPermissions(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO)
	if err != nil {
		return nil, err
	}

	return &Cache{
		guestPermissions: conf.GuestPermissions,
		userPermissions:  userPermissions,
	}, nil
}

type userPermissions = map[string]map[string][]*v1.Permission

type Cache struct {
	// username -> projectname or * (global) -> perms
	userPermissions  userPermissions
	guestPermissions []*v1.Permission
}

func (r Cache) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool {
	// Checking default permission
	if ok := PermissionListHasPermission(r.guestPermissions, reqAction, reqScope); ok {
		return true
	}

	// Checking global perm first
	userPermissions, ok := r.userPermissions[user]
	if !ok {
		return false
	}

	// Perm checked at project level but perm can be found in a global role
	if len(reqProject) > 0 {
		globalPermissions, ok := userPermissions[""]
		if !ok {
			return false
		}

		// Check user perm
		if ok := PermissionListHasPermission(globalPermissions, reqAction, reqScope); ok {
			return true
		}
	}

	projectPermissions, ok := userPermissions[reqProject]
	if !ok {
		return false
	}
	return PermissionListHasPermission(projectPermissions, reqAction, reqScope)
}
