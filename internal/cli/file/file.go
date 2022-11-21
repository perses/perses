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

	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"
)

func Unmarshal(file string, obj interface{}) error {
	data, isJSON, err := readAndDetect(file)
	if err != nil {
		return err
	}
	if isJSON {
		if jsonErr := json.Unmarshal(data, obj); jsonErr != nil {
			return jsonErr
		}
	} else {
		if yamlErr := yaml.Unmarshal(data, obj); yamlErr != nil {
			return yamlErr
		}
	}
	return nil
}

func UnmarshalEntity(file string) ([]modelAPI.Entity, error) {
	u := &unmarshaller{}
	return u.unmarshal(file)
}

type unmarshaller struct {
	isJSON  bool
	objects []map[string]interface{}
}

func (u *unmarshaller) unmarshal(file string) ([]modelAPI.Entity, error) {
	if err := u.read(file); err != nil {
		return nil, err
	}

	return u.unmarshalEntities()
}

func (u *unmarshaller) read(file string) error {
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

func (u *unmarshaller) unmarshalEntities() ([]modelAPI.Entity, error) {
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
		entity, err := modelV1.GetStruct(kind)
		if err != nil {
			logrus.WithError(err).Debugf("unable to get the struct")
			return nil, fmt.Errorf("resource %q not supported by the command", kind)
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
		unmarshalErr := u.unmarshalEntity(data, entity)
		if unmarshalErr != nil {
			return nil, fmt.Errorf("cannot extract %s, unmarshalling error: %s", kind, unmarshalErr)
		}
		result = append(result, entity)
	}
	return result, nil
}

func (u *unmarshaller) unmarshalEntity(data []byte, entity modelAPI.Entity) error {
	var unmarshalErr error
	if u.isJSON {
		unmarshalErr = json.Unmarshal(data, entity)
	} else {
		unmarshalErr = yaml.Unmarshal(data, entity)
	}
	return unmarshalErr
}
