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

package databasefile

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strings"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"gopkg.in/yaml.v3"
)

func generateID(kind modelV1.Kind, metadata modelAPI.Metadata) (string, error) {
	switch m := metadata.(type) {
	case *modelV1.ProjectMetadata:
		return path.Join(modelV1.PluralKindMap[kind], m.Project, m.Name), nil
	case *modelV1.Metadata:
		return path.Join(modelV1.PluralKindMap[kind], m.Name), nil
	}
	return "", fmt.Errorf("metadata %T not managed", metadata)
}

type DAO struct {
	databaseModel.DAO
	Folder        string
	Extension     config.FileExtension
	CaseSensitive bool
}

func (d *DAO) Init() error {
	return nil
}

func (d *DAO) IsCaseSensitive() bool {
	return d.CaseSensitive
}

func (d *DAO) Close() error {
	return nil
}

func (d *DAO) Create(entity modelAPI.Entity) error {
	// Flatten the metadata in case the config is activated.
	// We are modifying the metadata to be sure the user will acknowledge this config.
	// Also, it will avoid an issue with the permission when activated.
	// See https://github.com/perses/perses/issues/1721 for more details.
	entity.GetMetadata().Flatten(d.CaseSensitive)
	key, generateIDErr := generateID(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	if generateIDErr != nil {
		return generateIDErr
	}
	filePath := d.buildPath(key)
	if _, err := os.Stat(filePath); err == nil {
		// The file exists, so we should return a conflict error.
		return &databaseModel.Error{Key: key, Code: databaseModel.ErrorCodeConflict}
	}
	return d.upsert(key, entity)
}
func (d *DAO) Upsert(entity modelAPI.Entity) error {
	entity.GetMetadata().Flatten(d.CaseSensitive)
	key, generateIDErr := generateID(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	if generateIDErr != nil {
		return generateIDErr
	}
	return d.upsert(key, entity)
}
func (d *DAO) Get(kind modelV1.Kind, metadata modelAPI.Metadata, entity modelAPI.Entity) error {
	metadata.Flatten(d.CaseSensitive)
	key, generateIDErr := generateID(kind, metadata)
	if generateIDErr != nil {
		return generateIDErr
	}
	filePath := d.buildPath(key)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &databaseModel.Error{Key: key, Code: databaseModel.ErrorCodeNotFound}
		}
		return err
	}
	if unMarshalErr := d.unmarshal(data, entity); unMarshalErr != nil {
		return unMarshalErr
	}
	// This last check is here to verify that we get the accurate document.
	// On macOS, the filesystem is not case-sensitive regarding the search.
	// So if you have a document named "foo",
	// it will be returned if you are looking for "Foo", "FoO" etc.
	if entity.GetMetadata().GetName() != metadata.GetName() {
		return &databaseModel.Error{Key: key, Code: databaseModel.ErrorCodeNotFound}
	}
	return nil
}

func (d *DAO) RawMetadataQuery(_ databaseModel.Query, _ modelV1.Kind) ([]json.RawMessage, error) {
	return nil, fmt.Errorf("raw metadata query not implemented")
}

func (d *DAO) RawQuery(query databaseModel.Query) ([]json.RawMessage, error) {
	folder, prefix, isExist, err := d.buildQuery(query)
	if err != nil {
		return nil, fmt.Errorf("unable to build the query: %s", err)
	}
	if !isExist {
		// There is nothing to return. So let's initialize the slice just to avoid returning a nil slice
		return make([]json.RawMessage, 0), nil
	}
	// so now we have the proper folder to looking for and potentially a filter to use
	var files []string
	if files, err = d.visit(folder, prefix); err != nil {
		return nil, err
	}
	if len(files) <= 0 {
		// in case the result is empty, let's initialize the slice just to avoid returning a nil slice
		return make([]json.RawMessage, 0), nil
	}
	result := []json.RawMessage{}

	for _, file := range files {
		// now read all files and append them to the final result
		data, readErr := os.ReadFile(file)
		if readErr != nil {
			return nil, readErr
		}

		// If it's YAML, we need to convert to JSON first
		if d.Extension == config.YAMLExtension {
			// Parse the YAML content
			var yamlData interface{}
			if err := yaml.Unmarshal(data, &yamlData); err != nil {
				return nil, fmt.Errorf("failed to parse YAML from %s: %w", file, err)
			}

			// Convert YAML to JSON
			jsonData, err := json.Marshal(yamlData)
			if err != nil {
				return nil, fmt.Errorf("failed to convert to JSON from %s: %w", file, err)
			}
			result = append(result, json.RawMessage(jsonData))
		} else {
			// For JSON files, we can append directly
			result = append(result, json.RawMessage(data))
		}
	}
	return result, nil
}

func (d *DAO) Query(query databaseModel.Query, slice interface{}) error {
	typeParameter := reflect.TypeOf(slice)
	result := reflect.ValueOf(slice)
	// to avoid any miss usage when using this method, slice should be a pointer to a slice.
	// first check if slice is a pointer
	if typeParameter.Kind() != reflect.Ptr {
		return fmt.Errorf("slice in parameter is not a pointer to a slice but a %q", typeParameter.Kind())
	}

	// It's a pointer, so move to the actual element behind the pointer.
	// Having a pointer avoid getting the error:
	//           reflect.Value.Set using unaddressable value
	// It's because the slice is usually not initialized and doesn't have any memory allocated.
	// So it's simpler to require a pointer at the beginning.
	sliceElem := result.Elem()
	typeParameter = typeParameter.Elem()

	if typeParameter.Kind() != reflect.Slice {
		return fmt.Errorf("slice in parameter is not actually a slice but a %q", typeParameter.Kind())
	}
	folder, prefix, isExist, err := d.buildQuery(query)
	if err != nil {
		return fmt.Errorf("unable to build the query: %s", err)
	}
	if !isExist {
		// There is nothing to return. So let's initialize the slice just to avoid returning a nil slice
		sliceElem = reflect.MakeSlice(typeParameter, 0, 0)
		// And finally, reset the element of the slice to ensure we didn't disconnect the link between the pointer to the slice and the actual slice
		result.Elem().Set(sliceElem)
		return nil
	}
	// so now we have the proper folder to looking for and potentially a filter to use
	var files []string
	if files, err = d.visit(folder, prefix); err != nil {
		return err
	}
	if len(files) <= 0 {
		// in case the result is empty, let's initialize the slice just to avoid returning a nil slice
		sliceElem = reflect.MakeSlice(typeParameter, 0, 0)
	}
	for _, file := range files {
		// now read all files and append them to the final result
		data, readErr := os.ReadFile(file)
		if readErr != nil {
			return readErr
		}
		// first create a pointer with the accurate type
		var value reflect.Value
		if typeParameter.Elem().Kind() != reflect.Ptr {
			value = reflect.New(typeParameter.Elem())
		} else {
			// in case it's a pointer, then we should create a pointer of the struct and not a pointer of a pointer
			value = reflect.New(typeParameter.Elem().Elem())
		}
		// then get back the actual struct behind the value.
		obj := value.Interface()
		if unmarshalErr := d.unmarshal(data, obj); unmarshalErr != nil {
			return unmarshalErr
		}
		if typeParameter.Elem().Kind() != reflect.Ptr {
			// In case the type of the slice element is not a pointer,
			// we should return the value of the pointer created in the previous step.
			sliceElem.Set(reflect.Append(sliceElem, value.Elem()))
		} else {
			sliceElem.Set(reflect.Append(sliceElem, value))
		}
	}
	// At the end reset the element of the slice to ensure we didn't disconnect the link between the pointer to the slice and the actual slice
	result.Elem().Set(sliceElem)
	return nil
}
func (d *DAO) Delete(kind modelV1.Kind, metadata modelAPI.Metadata) error {
	key, generateIDErr := generateID(kind, metadata)
	if generateIDErr != nil {
		return generateIDErr
	}
	filePath := d.buildPath(key)
	err := os.Remove(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &databaseModel.Error{Key: key, Code: databaseModel.ErrorCodeNotFound}
		}
		return err
	}
	return nil
}

func (d *DAO) DeleteByQuery(query databaseModel.Query) error {
	folder, prefix, isExist, err := d.buildQuery(query)
	if err != nil {
		return fmt.Errorf("unable to build the query: %s", err)
	}
	if !isExist {
		return nil
	}
	if len(prefix) == 0 {
		return os.RemoveAll(folder)
	}
	// in case there is a prefix file name we need to delete only the files that is matching the prefix and not the folder entirely
	var files []string
	if files, err = d.visit(folder, prefix); err != nil {
		return err
	}
	if len(files) <= 0 {
		return nil
	}
	for _, file := range files {
		if removeErr := os.Remove(file); removeErr != nil {
			return removeErr
		}
	}
	return nil
}

func (d *DAO) HealthCheck() bool {
	return true
}

func (d *DAO) GetLatestUpdateTime(_ []modelV1.Kind) (*string, error) {
	return nil, nil
}

func (d *DAO) upsert(key string, entity modelAPI.Entity) error {
	filePath := d.buildPath(key)
	if err := os.MkdirAll(filepath.Dir(filePath), 0700); err != nil {
		return err
	}
	data, err := d.marshal(entity)
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0600)
}

func (d *DAO) buildPath(key string) string {
	return path.Join(d.Folder, fmt.Sprintf("%s.%s", key, d.Extension))
}

func (d *DAO) unmarshal(data []byte, entity interface{}) error {
	if d.Extension == config.JSONExtension {
		return json.Unmarshal(data, entity)
	}
	return yaml.Unmarshal(data, entity)
}

func (d *DAO) marshal(entity interface{}) ([]byte, error) {
	if d.Extension == config.JSONExtension {
		return json.Marshal(entity)
	}
	return yaml.Marshal(entity)
}

func (d *DAO) visit(rootPath string, prefix string) ([]string, error) {
	var result []string
	err := filepath.Walk(rootPath, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		fileName := info.Name()
		if filepath.Ext(fileName) != fmt.Sprintf(".%s", d.Extension) {
			// skip every file that doesn't have the correct extension
			return nil
		}
		if len(prefix) == 0 || strings.HasPrefix(fileName, prefix) {
			result = append(result, path)
		}
		return nil
	})

	return result, err
}
