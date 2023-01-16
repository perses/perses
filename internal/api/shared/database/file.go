package database

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strings"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/config"
	"gopkg.in/yaml.v2"
)

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
	data, err := d.marshal(entity)
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0600)
}
func (d *fileDAO) Get(key string, entity interface{}) error {
	filePath := d.buildPath(key)
	data, err := os.ReadFile(filePath)
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
	if files, err = d.visit(folder, prefix); err != nil {
		return err
	}
	if len(files) <= 0 {
		// in case the result is empty, let's initialize the slice just to avoid returning a nil slice
		sliceElem = reflect.MakeSlice(typeParameter, 0, 0)
	}
	for _, file := range files {
		// now read all file and append them to the final result
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
		if unmarshalErr := d.unmarshal(data, obj); err != nil {
			return unmarshalErr
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

func (d *fileDAO) visit(rootPath string, prefix string) ([]string, error) {
	var result []string
	err := filepath.Walk(rootPath, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		fileName := info.Name()
		if filepath.Ext(fileName) != fmt.Sprintf(".%s", d.extension) {
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
