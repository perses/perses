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

package v1

import (
	"encoding/json"
	"fmt"
)

type ScopeKind string

const (
	DashboardScope                   = ScopeKind(KindDashboard)
	DatasourceScope                  = ScopeKind(KindDatasource)
	FolderScope                      = ScopeKind(KindFolder)
	GlobalDatasourceScope            = ScopeKind(KindGlobalDatasource)
	GlobalRoleScope                  = ScopeKind(KindGlobalRole)
	GlobalRoleBindingScope           = ScopeKind(KindGlobalRoleBinding)
	GlobalSecretScope                = ScopeKind(KindGlobalSecret)
	GlobalVariableScope              = ScopeKind(KindGlobalVariable)
	ProjectScope                     = ScopeKind(KindProject)
	RoleScope                        = ScopeKind(KindRole)
	RoleBindingScope                 = ScopeKind(KindRoleBinding)
	SecretScope                      = ScopeKind(KindSecret)
	UserScope                        = ScopeKind(KindUser)
	VariableScope                    = ScopeKind(KindVariable)
	WildcardScope          ScopeKind = "*"
)

var ScopeKindMap = map[string]ScopeKind{
	string(KindDashboard):         DashboardScope,
	string(KindDatasource):        DatasourceScope,
	string(KindFolder):            FolderScope,
	string(KindGlobalDatasource):  GlobalDatasourceScope,
	string(KindGlobalRole):        GlobalRoleScope,
	string(KindGlobalRoleBinding): GlobalRoleBindingScope,
	string(KindGlobalSecret):      GlobalSecretScope,
	string(KindGlobalVariable):    GlobalVariableScope,
	string(KindProject):           ProjectScope,
	string(KindRole):              RoleScope,
	string(KindRoleBinding):       RoleBindingScope,
	string(KindSecret):            SecretScope,
	string(KindUser):              UserScope,
	string(KindVariable):          VariableScope,
	"*":                           WildcardScope,
}

func (k *ScopeKind) UnmarshalJSON(data []byte) error {
	var tmp ScopeKind
	type plain ScopeKind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *ScopeKind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp ScopeKind
	type plain ScopeKind
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *ScopeKind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("kind cannot be empty")
	}
	if _, err := GetScopeKind(string(*k)); err != nil {
		return err
	}
	return nil
}

// GetScopeKind parse string to Kind (not case-sensitive)
func GetScopeKind(kind string) (*ScopeKind, error) {
	if kind == string(WildcardScope) {
		result := WildcardScope
		return &result, nil
	}
	k, err := GetKind(kind)
	if err != nil {
		return nil, err
	}
	if result, ok := ScopeKindMap[string(*k)]; ok {
		return &result, nil
	}
	return nil, fmt.Errorf("unknown kind %q used", kind)
}

func IsGlobalScope(kind ScopeKind) bool {
	switch kind {
	case GlobalDatasourceScope, GlobalRoleScope, GlobalRoleBindingScope, GlobalSecretScope, GlobalVariableScope, ProjectScope, UserScope, WildcardScope:
		return true
	default:
		return false
	}
}
