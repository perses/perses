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

package file

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

func Exists(filePath string) (bool, error) {
	_, osErr := os.Stat(filePath)
	if osErr != nil {
		if errors.Is(osErr, os.ErrNotExist) {
			return false, nil
		}
		return false, osErr
	}
	return true, nil
}

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

// UnmarshalEntities will read the file if provided or the directory and will extract any Perses resources.
func UnmarshalEntities(file string, dir string) ([]modelAPI.Entity, error) {
	var entities []modelAPI.Entity
	if len(file) > 0 {
		var err error
		entities, err = UnmarshalEntitiesFromFile(file)
		if err != nil {
			return nil, err
		}
	} else if len(dir) > 0 {
		var errorList []error
		entities, errorList = UnmarshalEntitiesFromDirectory(dir)
		if len(errorList) > 0 {
			return nil, errorList[0]
		}
	}
	return entities, nil
}

func UnmarshalEntitiesFromDirectory(dir string) ([]modelAPI.Entity, []error) {
	files, err := visit(dir)
	if err != nil {
		return nil, []error{err}
	}
	var entities []modelAPI.Entity
	var errors []error
	for _, f := range files {
		es, unmarshalErr := UnmarshalEntitiesFromFile(f)
		if unmarshalErr != nil {
			errors = append(errors, unmarshalErr)
			continue
		}
		entities = append(entities, es...)
	}
	return entities, errors
}

func UnmarshalEntitiesFromFile(file string) ([]modelAPI.Entity, error) {
	u := &unmarshaller{file: file}
	return u.unmarshal()
}

func visit(dir string) ([]string, error) {
	var files []string
	err := filepath.Walk(dir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		fileName := info.Name()
		if filepath.Ext(fileName) != ".json" && filepath.Ext(fileName) != ".yaml" {
			// skip every file that doesn't have the correct extension
			return nil
		}
		files = append(files, path)
		return nil
	})

	return files, err
}

type unmarshaller struct {
	isJSON  bool
	file    string
	objects []map[string]interface{}
}

func (u *unmarshaller) unmarshal() ([]modelAPI.Entity, error) {
	if err := u.read(); err != nil {
		return nil, err
	}

	return u.unmarshalEntities()
}

func (u *unmarshaller) read() error {
	data, isJSON, err := readAndDetect(u.file)
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
		return nil, fmt.Errorf("unable to unmarshall data from the file %q, data is empty", u.file)
	}
	var result []modelAPI.Entity
	for i, object := range u.objects {
		if _, ok := object["kind"]; !ok {
			return nil, fmt.Errorf("objects[%d] from file %q unable to find 'kind' field", i, u.file)
		}
		kind := modelV1.Kind(fmt.Sprintf("%v", object["kind"]))
		// We create the service associated to the current resource.
		// It will be used to unmarshal the resource with the accurate struct.
		entity, err := modelV1.GetStruct(kind)
		if err != nil {
			logrus.WithError(err).Debugf("unable to get the struct")
			return nil, fmt.Errorf("resource %q from file %q not supported by the command", kind, u.file)
		}
		// Let's marshal the resource, so we can finally unmarshal it with an accurate struct.
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
