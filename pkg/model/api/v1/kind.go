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
	"strings"

	modelAPI "github.com/perses/perses/pkg/model/api"
)

type Kind string

const (
	KindDashboard          Kind = "Dashboard"
	KindDatasource         Kind = "Datasource"
	KindEphemeralDashboard Kind = "EphemeralDashboard"
	KindFolder             Kind = "Folder"
	KindGlobalDatasource   Kind = "GlobalDatasource"
	KindGlobalRole         Kind = "GlobalRole"
	KindGlobalRoleBinding  Kind = "GlobalRoleBinding"
	KindGlobalVariable     Kind = "GlobalVariable"
	KindGlobalSecret       Kind = "GlobalSecret"
	KindProject            Kind = "Project"
	KindRole               Kind = "Role"
	KindRoleBinding        Kind = "RoleBinding"
	KindSecret             Kind = "Secret"
	KindUser               Kind = "User"
	KindVariable           Kind = "Variable"
)

var PluralKindMap = map[Kind]string{
	KindDashboard:          "dashboards",
	KindDatasource:         "datasources",
	KindEphemeralDashboard: "ephemeraldashboards",
	KindFolder:             "folders",
	KindGlobalDatasource:   "globaldatasources",
	KindGlobalRole:         "globalroles",
	KindGlobalRoleBinding:  "globalrolebindings",
	KindGlobalSecret:       "globalsecrets",
	KindGlobalVariable:     "globalvariables",
	KindProject:            "projects",
	KindRole:               "roles",
	KindRoleBinding:        "rolebindings",
	KindSecret:             "secrets",
	KindUser:               "users",
	KindVariable:           "variables",
}

func (k *Kind) UnmarshalJSON(data []byte) error {
	var tmp Kind
	type plain Kind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Kind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Kind
	type plain Kind
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Kind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("kind cannot be empty")
	}
	kind, err := GetKind(string(*k))
	if err != nil {
		return err
	}
	*k = *kind
	return nil
}

// GetStruct return a pointer to an empty struct that matches the kind passed as a parameter.
func GetStruct(kind Kind) (modelAPI.Entity, error) {
	switch kind {
	case KindDashboard:
		return &Dashboard{}, nil
	case KindDatasource:
		return &Datasource{}, nil
	case KindEphemeralDashboard:
		return &EphemeralDashboard{}, nil
	case KindFolder:
		return &Folder{}, nil
	case KindGlobalDatasource:
		return &GlobalDatasource{}, nil
	case KindGlobalRole:
		return &GlobalRole{}, nil
	case KindGlobalRoleBinding:
		return &GlobalRoleBinding{}, nil
	case KindGlobalSecret:
		return &GlobalSecret{}, nil
	case KindGlobalVariable:
		return &GlobalVariable{}, nil
	case KindProject:
		return &Project{}, nil
	case KindRole:
		return &Role{}, nil
	case KindRoleBinding:
		return &RoleBinding{}, nil
	case KindSecret:
		return &Secret{}, nil
	case KindUser:
		return &User{}, nil
	case KindVariable:
		return &Variable{}, nil
	default:
		return nil, fmt.Errorf("%q has no associated struct", kind)
	}
}

func IsGlobal(kind Kind) bool {
	switch kind {
	case KindGlobalDatasource, KindGlobalRole, KindGlobalRoleBinding, KindGlobalSecret, KindGlobalVariable, KindProject, KindUser:
		return true
	default:
		return false
	}
}

// GetKind parse string to Kind (not case-sensitive)
func GetKind(kind string) (*Kind, error) {
	switch strings.ToLower(kind) {
	case strings.ToLower(string(KindDashboard)):
		result := KindDashboard
		return &result, nil
	case strings.ToLower(string(KindDatasource)):
		result := KindDatasource
		return &result, nil
	case strings.ToLower(string(KindEphemeralDashboard)):
		result := KindEphemeralDashboard
		return &result, nil
	case strings.ToLower(string(KindFolder)):
		result := KindFolder
		return &result, nil
	case strings.ToLower(string(KindGlobalDatasource)):
		result := KindGlobalDatasource
		return &result, nil
	case strings.ToLower(string(KindGlobalRole)):
		result := KindGlobalRole
		return &result, nil
	case strings.ToLower(string(KindGlobalRoleBinding)):
		result := KindGlobalRoleBinding
		return &result, nil
	case strings.ToLower(string(KindGlobalSecret)):
		result := KindGlobalSecret
		return &result, nil
	case strings.ToLower(string(KindGlobalVariable)):
		result := KindGlobalVariable
		return &result, nil
	case strings.ToLower(string(KindProject)):
		result := KindProject
		return &result, nil
	case strings.ToLower(string(KindRole)):
		result := KindRole
		return &result, nil
	case strings.ToLower(string(KindRoleBinding)):
		result := KindRoleBinding
		return &result, nil
	case strings.ToLower(string(KindSecret)):
		result := KindSecret
		return &result, nil
	case strings.ToLower(string(KindUser)):
		result := KindUser
		return &result, nil
	case strings.ToLower(string(KindVariable)):
		result := KindVariable
		return &result, nil
	default:
		return nil, fmt.Errorf("unknown kind %q used", kind)
	}
}
