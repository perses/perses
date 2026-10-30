// Copyright The Perses Authors
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
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

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

func Unmarshal(file string, obj any) error {
	data, isJSON, err := Read(file)
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
	files, err := List(dir)
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

// UnmarshalEntitiesFromData extracts the Perses resources from the content of a file, as returned by Read.
func UnmarshalEntitiesFromData(file string, data []byte, isJSON bool) ([]modelAPI.Entity, error) {
	u := &unmarshaller{file: file}
	if err := u.decode(data, isJSON); err != nil {
		return nil, err
	}
	return u.unmarshalEntities()
}

// Resource is a resource of a file, as returned by UnmarshalResourcesFromData.
type Resource struct {
	// Index is the position of the resource in the file, the lists being flattened and the empty YAML documents skipped.
	Index int
	// Entity is the decoded resource. It is nil when Err is set.
	Entity modelAPI.Entity
	// Err is set when the resource cannot be decoded.
	Err error
}

// UnmarshalResourcesFromData is like UnmarshalEntitiesFromData, but it doesn't stop at the first resource that cannot be decoded.
// It returns every resource of the content with its position, and an error for each resource that cannot be decoded.
// The error is set only when the whole content cannot be decoded, like a syntax error or an empty file.
func UnmarshalResourcesFromData(file string, data []byte, isJSON bool) ([]Resource, error) {
	items, err := decodeItems(data, isJSON)
	if err != nil {
		return nil, newReadFileErr(file, err)
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("unable to unmarshall data from the file %q, data is empty", file)
	}
	u := &unmarshaller{file: file, isJSON: isJSON}
	resources := make([]Resource, 0, len(items))
	for i, item := range items {
		object, ok := item.(map[string]any)
		if !ok {
			resources = append(resources, Resource{Index: i, Err: fmt.Errorf("objects[%d] from file %q must be an object, got %T", i, file, item)})
			continue
		}
		entity, unmarshalErr := u.unmarshalObject(i, object)
		if unmarshalErr != nil {
			// Keep the index, so the failures of the resources of the same file can be told apart.
			if index := fmt.Sprintf("objects[%d]", i); !strings.Contains(unmarshalErr.Error(), index) {
				unmarshalErr = fmt.Errorf("%s: %w", index, unmarshalErr)
			}
			resources = append(resources, Resource{Index: i, Err: unmarshalErr})
			continue
		}
		resources = append(resources, Resource{Index: i, Entity: entity})
	}
	return resources, nil
}

// decodeItems decodes a JSON content or every document of a YAML content, each containing a resource or a list of resources.
// It returns the items, whatever their type, so an invalid item can be reported without discarding the others.
func decodeItems(data []byte, isJSON bool) ([]any, error) {
	var documents []any
	if isJSON {
		var document any
		if err := json.Unmarshal(data, &document); err != nil {
			return nil, err
		}
		documents = append(documents, document)
	} else {
		decoder := yaml.NewDecoder(bytes.NewReader(data))
		for {
			var document any
			if err := decoder.Decode(&document); err != nil {
				if errors.Is(err, io.EOF) {
					break
				}
				return nil, err
			}
			documents = append(documents, document)
		}
	}
	var items []any
	for _, document := range documents {
		switch doc := document.(type) {
		case nil:
			// Empty YAML documents (e.g. consecutive '---') are ignored.
		case []any:
			items = append(items, doc...)
		default:
			items = append(items, doc)
		}
	}
	return items, nil
}

// List returns the JSON and YAML files found in the directory and its subdirectories.
func List(dir string) ([]string, error) {
	var files []string
	err := filepath.Walk(dir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		fileName := info.Name()
		if filepath.Ext(fileName) != ".json" && filepath.Ext(fileName) != ".yaml" && filepath.Ext(fileName) != ".yml" {
			// skip every file that doesn't have the correct extension
			logrus.Tracef("Skipping %s", fileName)
			return nil
		}
		files = append(files, path)
		return nil
	})

	return files, err
}

// Copy a directory recursively
func CopyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(targetPath, 0750)
		}
		return Copy(path, targetPath)
	})
}

// Copy a file
func Copy(src, dst string) error {
	srcFile, err := os.Open(src) //nolint: gosec
	if err != nil {
		return err
	}
	defer srcFile.Close() //nolint: errcheck

	dstFile, err := os.Create(dst) //nolint: gosec
	if err != nil {
		return err
	}
	defer dstFile.Close() //nolint: errcheck

	_, err = io.Copy(dstFile, srcFile)
	return err
}

type unmarshaller struct {
	isJSON  bool
	file    string
	objects []map[string]any
}

func (u *unmarshaller) unmarshal() ([]modelAPI.Entity, error) {
	if err := u.read(); err != nil {
		return nil, err
	}

	return u.unmarshalEntities()
}

func (u *unmarshaller) read() error {
	data, isJSON, err := Read(u.file)
	if err != nil {
		return err
	}
	return u.decode(data, isJSON)
}

func (u *unmarshaller) decode(data []byte, isJSON bool) error {
	u.isJSON = isJSON

	var objects []map[string]any
	var object map[string]any

	if u.isJSON {
		if jsonErr := json.Unmarshal(data, &objects); jsonErr != nil {
			if jsonErr = json.Unmarshal(data, &object); jsonErr != nil {
				return newReadFileErr(u.file, jsonErr)
			}
			objects = append(objects, object)
		}
	} else {
		decodedObjects, decodeErr := decodeYAMLDocumentsAsObjects(data)
		if decodeErr != nil {
			return newReadFileErr(u.file, decodeErr)
		}
		objects = decodedObjects
	}
	u.objects = objects
	return nil
}

func decodeYAMLDocumentsAsObjects(data []byte) ([]map[string]any, error) {
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	var objects []map[string]any

	for {
		var document any
		if err := decoder.Decode(&document); err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, err
		}

		// Empty YAML documents (e.g. consecutive '---') are ignored.
		if document == nil {
			continue
		}

		switch doc := document.(type) {
		case []any:
			for i, item := range doc {
				obj, ok := item.(map[string]any)
				if !ok {
					return nil, fmt.Errorf("list item[%d] must be an object, got %T", i, item)
				}
				objects = append(objects, obj)
			}
		case map[string]any:
			objects = append(objects, doc)
		default:
			return nil, fmt.Errorf("expected an object or list of objects, got %T", doc)
		}
	}

	return objects, nil
}

func (u *unmarshaller) unmarshalEntities() ([]modelAPI.Entity, error) {
	if len(u.objects) == 0 {
		return nil, fmt.Errorf("unable to unmarshall data from the file %q, data is empty", u.file)
	}
	var result []modelAPI.Entity
	for i, object := range u.objects {
		entity, err := u.unmarshalObject(i, object)
		if err != nil {
			return nil, err
		}
		result = append(result, entity)
	}
	return result, nil
}

func (u *unmarshaller) unmarshalObject(i int, object map[string]any) (modelAPI.Entity, error) {
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
	return entity, nil
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
