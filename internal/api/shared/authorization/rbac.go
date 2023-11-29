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

package authorization

import (
	"context"

	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared/authorization/rbac"
	"github.com/perses/perses/internal/api/shared/crypto"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type RBAC interface {
	IsEnabled() bool
	HasPermission(user string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool
	Refresh() error
}

func NewRBAC(userDAO user.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, jwtService crypto.JWT, conf config.Config) (RBAC, error) {

	if !conf.Security.EnableAuth {
		return &rbac.DisabledImpl{}, nil
	}

	newCache, err := rbac.NewCache(userDAO, roleDAO, roleBindingDAO, globalRoleDAO, globalRoleBindingDAO)
	if err != nil {
		return nil, err
	}

	return &rbac.CacheImpl{
		Cache:                newCache,
		UserDAO:              userDAO,
		RoleDAO:              roleDAO,
		RoleBindingDAO:       roleBindingDAO,
		GlobalRoleDAO:        globalRoleDAO,
		GlobalRoleBindingDAO: globalRoleBindingDAO,
		JwtService:           jwtService,
		GuestPermissions:     conf.Security.Authorization.GuestPermissions,
	}, nil
}

func NewCronTask(rbacService RBAC) async.SimpleTask {
	return &rbacTask{svc: rbacService}
}

type rbacTask struct {
	async.SimpleTask
	svc RBAC
}

func (r *rbacTask) Execute(_ context.Context, _ context.CancelFunc) error {
	return r.svc.Refresh()
}

func (r *rbacTask) String() string {
	return "rbac refresh cache"
}
