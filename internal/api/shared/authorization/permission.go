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

package authorization

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const (
	wildcard = "*"
)

func PermissionListHasPermission(permissions []*v1.Permission, reqAction v1.ActionKind, reqScope v1.Kind) bool {
	for _, permission := range permissions {
		for _, action := range permission.Actions {
			if action == reqAction || action == v1.WildcardAction {
				for _, scope := range permission.Scopes {
					if scope == reqScope || scope == wildcard { // TODO: wildcard var
						return true
					}
				}
			}
		}
	}
	return false
}

type Need struct {
	Action v1.ActionKind
	// If project is empty it's a global permission
	Project string
	Scope   v1.Kind
}
