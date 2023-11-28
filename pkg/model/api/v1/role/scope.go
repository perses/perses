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

package role

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Scope string

const (
	DashboardScope         Scope = "Dashboard"
	DatasourceScope        Scope = "Datasource"
	FolderScope            Scope = "Folder"
	GlobalDatasourceScope  Scope = "GlobalDatasource"
	GlobalRoleScope        Scope = "GlobalRole"
	GlobalRoleBindingScope Scope = "GlobalRoleBinding"
	GlobalSecretScope      Scope = "GlobalSecret"
	GlobalVariableScope    Scope = "GlobalVariable"
	ProjectScope           Scope = "Project"
	RoleScope              Scope = "Role"
	RoleBindingScope       Scope = "RoleBinding"
	SecretScope            Scope = "Secret"
	UserScope              Scope = "User"
	VariableScope          Scope = "Variable"
	WildcardScope          Scope = "*"
)

func (k *Scope) UnmarshalJSON(data []byte) error {
	var tmp Scope
	type plain Scope
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Scope) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Scope
	type plain Scope
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Scope) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("scope cannot be empty")
	}
	if _, err := GetScope(string(*k)); err != nil {
		return err
	}
	return nil
}

// GetScope parse string to Scope (not case-sensitive)
func GetScope(scope string) (*Scope, error) {
	switch strings.ToLower(scope) {
	case strings.ToLower(string(DashboardScope)):
		result := DashboardScope
		return &result, nil
	case strings.ToLower(string(DatasourceScope)):
		result := DatasourceScope
		return &result, nil
	case strings.ToLower(string(FolderScope)):
		result := FolderScope
		return &result, nil
	case strings.ToLower(string(GlobalDatasourceScope)):
		result := GlobalDatasourceScope
		return &result, nil
	case strings.ToLower(string(GlobalRoleScope)):
		result := GlobalRoleScope
		return &result, nil
	case strings.ToLower(string(GlobalRoleBindingScope)):
		result := GlobalRoleBindingScope
		return &result, nil
	case strings.ToLower(string(GlobalSecretScope)):
		result := GlobalSecretScope
		return &result, nil
	case strings.ToLower(string(GlobalVariableScope)):
		result := GlobalVariableScope
		return &result, nil
	case strings.ToLower(string(ProjectScope)):
		result := ProjectScope
		return &result, nil
	case strings.ToLower(string(RoleScope)):
		result := RoleScope
		return &result, nil
	case strings.ToLower(string(RoleBindingScope)):
		result := RoleBindingScope
		return &result, nil
	case strings.ToLower(string(SecretScope)):
		result := SecretScope
		return &result, nil
	case strings.ToLower(string(UserScope)):
		result := UserScope
		return &result, nil
	case strings.ToLower(string(VariableScope)):
		result := VariableScope
		return &result, nil
	case strings.ToLower(string(WildcardScope)):
		result := WildcardScope
		return &result, nil
	default:
		return nil, fmt.Errorf("unknown scope %q used", scope)
	}
}

func IsGlobalScope(scope Scope) bool {
	switch scope {
	// ProjectScope is not global even if it should be. Owners of projects should be able to delete their own projects
	// As ProjectScope is not Global, it can be added in Role scopes and allow this flow.
	case GlobalDatasourceScope, GlobalRoleScope, GlobalRoleBindingScope, GlobalSecretScope, GlobalVariableScope, UserScope:
		return true
	default:
		return false
	}
}
