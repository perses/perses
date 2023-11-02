// Copyright 2021 The Perses Authors
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

package dependency

import (
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/authorization"
)

type AuthorizationManager interface {
	GetRBAC() authorization.RBAC
}

type authorztion struct {
	AuthorizationManager
	rbac authorization.RBAC
}

func NewAuthorizationManager(dao PersistenceManager, conf config.Config) (AuthorizationManager, error) {
	rbac, err := authorization.NewRBAC(dao.GetUser(), dao.GetRole(), dao.GetRoleBinding(), dao.GetGlobalRole(), dao.GetGlobalRoleBinding(), conf.Authorization)
	if err != nil {
		return nil, err
	}
	return &authorztion{rbac: rbac}, nil
}
