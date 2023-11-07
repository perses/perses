package authorization

import (
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

func CheckUserPermission(rbac RBAC, claims *crypto.JWTCustomClaims, action v1.ActionKind, project string, scope v1.Kind) error {
	if !rbac.IsEnabled() {
		return nil
	}
	if claims == nil {
		return shared.HandleBadRequestError("missing token")
	}
	if !rbac.HasPermission(claims.Subject, action, project, scope) {
		return shared.HandleBadRequestError("permission denied")
	}
	return nil
}

type RBAC interface {
	IsEnabled() bool
	HasPermission(user string, action v1.ActionKind, project string, kind v1.Kind) bool
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
		cache:      cache,
		jwtService: jwtService,
		isEnabled:  *conf.Security.ActivatePermission,
	}, nil
}

type rbacImpl struct {
	cache      *Cache
	jwtService crypto.JWT
	isEnabled  bool
	// TODO: refresh async.SimpleTask
}

func (r rbacImpl) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqKind v1.Kind) bool {
	return r.cache.HasPermission(user, reqAction, reqProject, reqKind)
}

func (r rbacImpl) IsEnabled() bool {
	return r.isEnabled
}

func NewCache(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.AuthorizationConfig) (*Cache, error) {
	var cache Cache
	// Retrieve users, roles, globalroles, rolebindings and globalrolebindings
	users, err := userDAO.List(&user.Query{})
	if err != nil {
		return nil, err
	}
	cache.users = users

	roles, err := roleDAO.List(&role.Query{})
	if err != nil {
		return nil, err
	}
	cache.roles = roles

	globalRoles, err := globalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return nil, err
	}
	cache.globalRoles = globalRoles

	roleBindings, err := roleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return nil, err
	}
	cache.roleBindings = roleBindings

	globalRoleBindings, err := globalRoleBindingDAO.List(&globalrolebinding.Query{})
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

	// Adding guest (default) permissions for connected users
	cache.guestPermissions = conf.GuestPermissions

	return &cache, nil
}

type Cache struct {
	users              []*v1.User
	roles              []*v1.Role
	globalRoles        []*v1.GlobalRole
	roleBindings       []*v1.RoleBinding
	globalRoleBindings []*v1.GlobalRoleBinding
	// user -> project / * (global) -> perms
	userPermissions  map[string]map[string][]*v1.Permission
	guestPermissions []*v1.Permission
}

func (r Cache) AddEntry(user string, project string, permission *v1.Permission) {
	if _, ok := r.userPermissions[user]; !ok {
		r.userPermissions[user] = make(map[string][]*v1.Permission)
	}

	if _, ok := r.userPermissions[user][project]; !ok { // TODO: check val ?
		r.userPermissions[user][project] = make([]*v1.Permission, 0)
	}
	r.userPermissions[user][project] = append(r.userPermissions[user][project], permission)
}

func (r Cache) FindRole(project string, name string) *v1.Role {
	for _, rle := range r.roles {
		if rle.Metadata.Name == name && rle.Metadata.Project == project {
			return rle
		}
	}
	return nil
}

func (r Cache) FindGlobalRole(name string) *v1.GlobalRole {
	for _, grle := range r.globalRoles {
		if grle.Metadata.Name == name {
			return grle
		}
	}
	return nil
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
