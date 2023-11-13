package rbac

import (
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type CacheImpl struct {
	Cache                *Cache
	UserDAO              user.DAO
	RoleDAO              role.DAO
	RoleBindingDAO       rolebinding.DAO
	GlobalRoleDAO        globalrole.DAO
	GlobalRoleBindingDAO globalrolebinding.DAO
	JwtService           crypto.JWT
	GuestPermissions     []*v1.Permission
	// TODO: refresh async.SimpleTask
}

func (r CacheImpl) IsEnabled() bool {
	return true
}

func (r CacheImpl) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool {
	// Checking default permissions
	if ok := PermissionListHasPermission(r.GuestPermissions, reqAction, reqScope); ok {
		return true
	}
	// Checking cached permissions
	return r.Cache.HasPermission(user, reqAction, reqProject, reqScope)
}

func (r CacheImpl) Refresh() error {
	usersPermissions, err := BuildUsersPermissions(r.UserDAO, r.RoleDAO, r.RoleBindingDAO, r.GlobalRoleDAO, r.GlobalRoleBindingDAO)
	if err != nil {
		return err
	}
	r.Cache.usersPermissions = usersPermissions
	return nil
}

func NewCache(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO) (*Cache, error) {
	usersPermissions, err := BuildUsersPermissions(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO)
	if err != nil {
		return nil, err
	}

	return &Cache{
		usersPermissions: usersPermissions,
	}, nil
}

type Cache struct {
	usersPermissions UsersPermissions
}

func (r Cache) HasPermission(user string, reqAction v1.ActionKind, reqProject string, reqScope v1.Kind) bool {
	usersPermissions, ok := r.usersPermissions[user]
	if !ok {
		return false
	}

	// Checking global perm first
	if len(reqProject) > 0 {
		globalPermissions, ok := usersPermissions[GlobalProject]
		if !ok {
			return false
		}

		// Check user perm
		if ok := PermissionListHasPermission(globalPermissions, reqAction, reqScope); ok {
			return true
		}
	}

	projectPermissions, ok := usersPermissions[reqProject]
	if !ok {
		return false
	}
	return PermissionListHasPermission(projectPermissions, reqAction, reqScope)
}
