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

package database

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strings"
	"time"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/config"
	"gopkg.in/yaml.v2"
)

type DAO interface {
	Create(key string, entity interface{}) error
	Upsert(key string, entity interface{}) error
	Get(key string, entity interface{}) error
	Query(query etcd.Query, slice interface{}) error
	Delete(key string) error
	HealthCheck() bool
}

func New(conf config.Database) (DAO, error) {
	if conf.Etcd != nil {
		timeout := time.Duration(conf.Etcd.RequestTimeoutSeconds) * time.Second
		etcdClient, err := etcd.NewETCDClient(*conf.Etcd)
		if err != nil {
			return nil, err
		}
		return etcd.NewDAO(etcdClient, timeout), nil
	}
	if conf.File != nil {
		return &fileDAO{
			folder:    conf.File.Folder,
			extension: conf.File.FileExtension,
		}, nil
	}
	return nil, fmt.Errorf("no dao defined")
}

type fileDAO struct {
	DAO
	folder    string
	extension config.FileExtension
}

func (d *fileDAO) Create(key string, entity interface{}) error {
	filePath := d.buildPath(key)
	if _, err := os.Stat(filePath); err == nil {
		// The file exists, so we should return a conflict error.
		// Let's use the etcd error so the caller doesn't have to handle multiple different kind of error
		// It's an easy hack let's say, but a bit crappy. We should probably at some point defined a higher error to wrap the one coming from the package etcd.
		return &etcd.Error{Key: key, Code: etcd.ErrorCodeKeyConflict}
	}
	return d.Upsert(key, entity)
}
func (d *fileDAO) Upsert(key string, entity interface{}) error {
	filePath := d.buildPath(key)
	if err := os.MkdirAll(filepath.Dir(filePath), 0700); err != nil {
		return err
	}
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		return err
	}
	defer file.Close()
	var data []byte
	data, err = d.marshal(entity)
	if err != nil {
		return err
	}
	if _, err := file.Write(data); err != nil {
		return err
	}
	return file.Sync()
}
func (d *fileDAO) Get(key string, entity interface{}) error {
	filePath := d.buildPath(key)
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &etcd.Error{Key: key, Code: etcd.ErrorCodeKeyNotFound}
		}
		return err
	}
	return d.unmarshal(data, entity)
}
func (d *fileDAO) Query(query etcd.Query, slice interface{}) error {
	typeParameter := reflect.TypeOf(slice)
	result := reflect.ValueOf(slice)
	// to avoid any miss usage when using this method, slice should be a pointer to a slice.
	// first check if slice is a pointer
	if typeParameter.Kind() != reflect.Ptr {
		return fmt.Errorf("slice in parameter is not a pointer to a slice but a %q", typeParameter.Kind())
	}

	// it's a pointer, so move to the actual element behind the pointer.
	// Having a pointer avoid getting the error:
	//           reflect.Value.Set using unaddressable value
	// It's because the slice is usually not initialized and doesn't have any memory allocated.
	// So it's simpler to require a pointer at the beginning.
	sliceElem := result.Elem()
	typeParameter = typeParameter.Elem()

	if typeParameter.Kind() != reflect.Slice {
		return fmt.Errorf("slice in parameter is not actually a slice but a %q", typeParameter.Kind())
	}
	q, err := query.Build()
	if err != nil {
		return fmt.Errorf("unable to build the query: %s", err)
	}
	// the query returned looks like a path and can finish with a partial name.
	// So we have to figure if the last path is the actual directory to looking for.
	// Or it's the partial name, and it should only be used to filter the list of the document.
	// For example: `/projects/per`.
	// `/projects` is the folder we are looking for, `per` is the partial name.
	folder := path.Join(d.folder, q)
	prefix := ""
	// An easy way to achieve is to:
	// 1. try if the path exist with the given query.
	if _, err = os.Stat(folder); os.IsNotExist(err) {
		// The path doesn't exist. So we certainly have to move to the parent path.
		prefix = filepath.Base(folder)
		folder = filepath.Dir(folder)
		// Let's try again if the path exists this time.
		if _, err = os.Stat(folder); os.IsNotExist(err) {
			// worst case, there is nothing to return. So let's initialize the slice just to avoid returning a nil slice
			sliceElem = reflect.MakeSlice(typeParameter, 0, 0)
			//and finally reset the element of the slice to ensure we didn't disconnect the link between the pointer to the slice and the actual slice
			result.Elem().Set(sliceElem)
			return nil
		}
	}
	// so now we have the proper folder to looking for and potentially a filter to use
	var files []string
	if err = d.visit(&files, folder, prefix); err != nil {
		return err
	}
	if len(files) <= 0 {
		// in case the result is empty, let's initialize the slice just to avoid returning a nil slice
		// TODO we should look inside the nested folder, that could make sense when we want to list all dashboards across project
		sliceElem = reflect.MakeSlice(typeParameter, 0, 0)
	}
	for _, file := range files {
		// now read all file and append them to the final result
		data, err := ioutil.ReadFile(fmt.Sprintf("%s/%s", folder, file))
		if err != nil {
			return err
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
		if err := d.unmarshal(data, obj); err != nil {
			return err
		}
		sliceElem.Set(reflect.Append(sliceElem, value))
	}
	// at the end reset the element of the slice to ensure we didn't disconnect the link between the pointer to the slice and the actual slice
	result.Elem().Set(sliceElem)
	return nil
}
func (d *fileDAO) Delete(key string) error {
	filePath := d.buildPath(key)
	err := os.Remove(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &etcd.Error{Key: key, Code: etcd.ErrorCodeKeyNotFound}
		}
		return err
	}
	return nil
}

func (d *fileDAO) HealthCheck() bool {
	return true
}

func (d *fileDAO) buildPath(key string) string {
	return path.Join(d.folder, fmt.Sprintf("%s.%s", key, d.extension))
}

func (d *fileDAO) unmarshal(data []byte, entity interface{}) error {
	if d.extension == config.JSONExtension {
		return json.Unmarshal(data, entity)
	}
	return yaml.Unmarshal(data, entity)
}

func (d *fileDAO) marshal(entity interface{}) ([]byte, error) {
	if d.extension == config.JSONExtension {
		return json.Marshal(entity)
	}
	return yaml.Marshal(entity)
}

func (d *fileDAO) visit(files *[]string, path string, prefix string) error {
	filesInfo, err := os.ReadDir(path)
	if err != nil {
		return err
	}

	for _, info := range filesInfo {
		if info.IsDir() {
			return nil
		}
		file := info.Name()
		if filepath.Ext(file) != fmt.Sprintf(".%s", d.extension) {
			// skip every file that doesn't have the correct extension
			return nil
		}

		if len(prefix) == 0 || strings.HasPrefix(file, prefix) {
			*files = append(*files, file)
		}
	}
	return nil
}
