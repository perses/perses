// Copyright 2022 The Perses Authors
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

package file

import (
	"encoding/json"
	"fmt"

	cmdUtilsService "github.com/perses/perses/internal/cli/utils/service"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"gopkg.in/yaml.v2"
)

type Unmarshaller struct {
	isJSON  bool
	objects []map[string]interface{}
}

func (u *Unmarshaller) Unmarshal(file string) ([]modelAPI.Entity, error) {
	if err := u.read(file); err != nil {
		return nil, err
	}

	return u.unmarshalEntity()
}

func (u *Unmarshaller) read(file string) error {
	data, isJSON, err := readAndDetect(file)
	if err != nil {
		return err
	}
	u.isJSON = isJSON

	var objects []map[string]interface{}
	var object map[string]interface{}

	if u.isJSON {
		if jsonErr := json.Unmarshal(data, &objects); jsonErr != nil {
			if jsonErr = json.Unmarshal(data, &object); jsonErr != nil {
				return newReadFileErr(jsonErr)
			}
			objects = append(objects, object)
		}
	} else {
		if yamlErr := yaml.Unmarshal(data, &objects); yamlErr != nil {
			if yamlErr = yaml.Unmarshal(data, &object); yamlErr != nil {
				return newReadFileErr(yamlErr)
			}
			objects = append(objects, object)
		}
	}
	u.objects = objects
	return nil
}

func (u *Unmarshaller) unmarshalEntity() ([]modelAPI.Entity, error) {
	if len(u.objects) == 0 {
		return nil, fmt.Errorf("unable to unmarshall data, data is empty")
	}
	var result []modelAPI.Entity
	for i, object := range u.objects {
		if _, ok := object["kind"]; !ok {
			return nil, fmt.Errorf("objects[%d] unable to find 'kind' field", i)
		}
		kind := modelV1.Kind(fmt.Sprintf("%v", object["kind"]))
		// we create the service associated to the current resource. It will be used to unmarshal the resource with the accurate struct.
		svc, err := cmdUtilsService.NewService(kind, "", nil)
		if err != nil {
			return nil, err
		}
		// Let's marshal the resource, so we can finally unmarshal it with the accurate struct.
		var data []byte
		var marshalErr error
		if u.isJSON {
			data, marshalErr = json.Marshal(object)
		} else {
			data, marshalErr = yaml.Marshal(object)
		}
		if marshalErr != nil {
			return nil, fmt.Errorf("cannot extract %s, marshalling error: %s", kind, marshalErr)
		}
		// Then let's use the service to unmarshal the resource.
		entity, unmarshalErr := svc.Unmarshal(u.isJSON, data)
		if unmarshalErr != nil {
			return nil, fmt.Errorf("cannot extract %s, unmarshalling error: %s", kind, unmarshalErr)
		}
		result = append(result, entity)
	}
	return result, nil
}
