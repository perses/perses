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

	modelAPI "github.com/perses/perses/pkg/model/api"
)

type Kind string

const (
	KindDashboard        Kind = "Dashboard"
	KindDatasource       Kind = "Datasource"
	KindFolder           Kind = "Folder"
	KindGlobalDatasource Kind = "GlobalDatasource"
	KindProject          Kind = "Project"
)

var KindMap = map[Kind]bool{
	KindDashboard:        true,
	KindDatasource:       true,
	KindFolder:           true,
	KindGlobalDatasource: true,
	KindProject:          true,
}

var PluralKindMap = map[Kind]string{
	KindDashboard:        "dashboards",
	KindDatasource:       "datasources",
	KindFolder:           "folders",
	KindGlobalDatasource: "globaldatasources",
	KindProject:          "projects",
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
	if _, ok := KindMap[*k]; !ok {
		return fmt.Errorf("unknown kind %q used", *k)
	}
	return nil
}

// GetStruct return a pointer to an empty struct that matches the kind passed as a parameter.
func GetStruct(kind Kind) (modelAPI.Entity, error) {
	switch kind {
	case KindDashboard:
		return &Dashboard{}, nil
	case KindDatasource:
		return &Datasource{}, nil
	case KindFolder:
		return &Folder{}, nil
	case KindGlobalDatasource:
		return &GlobalDatasource{}, nil
	case KindProject:
		return &Project{}, nil
	default:
		return nil, fmt.Errorf("%q has no associated struct", kind)
	}
}
