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
	apiInterface "github.com/perses/perses/internal/api/interface"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type disabledImpl struct{}

func (r *disabledImpl) IsEnabled() bool {
	return false
}

func (r *disabledImpl) GetUserProjects(_ apiInterface.PersesContext, _ v1Role.Action, _ v1Role.Scope) []string {
	return []string{}
}

func (r *disabledImpl) HasPermission(_ apiInterface.PersesContext, _ v1Role.Action, _ string, _ v1Role.Scope) bool {
	return true
}

func (r *disabledImpl) GetPermissions(_ apiInterface.PersesContext) map[string][]*v1Role.Permission {
	return nil
}

func (r *disabledImpl) Refresh() error {
	return nil
}
