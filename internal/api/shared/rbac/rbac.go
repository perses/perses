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
	"github.com/perses/perses/pkg/model/api/config"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type RBAC interface {
	IsEnabled() bool
	HasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool
	GetPermissions(user string) map[string][]*v1Role.Permission
	Refresh() error
}

func New(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.Config) (RBAC, error) {
	if !conf.Security.EnableAuth {
		return &disabledImpl{}, nil
	}

	impl := &cacheImpl{
		cache:                &cache{},
		userDAO:              userDAO,
		roleDAO:              roleDAO,
		roleBindingDAO:       roleBindingDAO,
		globalRoleDAO:        globalRoleDAO,
		globalRoleBindingDAO: globalRoleBindingDAO,
		guestPermissions:     conf.Security.Authorization.GuestPermissions,
	}
	return impl, impl.Refresh()
}
