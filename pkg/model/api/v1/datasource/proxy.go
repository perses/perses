// Copyright 2025 The Perses Authors
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

package datasource

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
)

const (
	ProxyKindField = "kind"
	ProxySpec      = "spec"
)

// GetProxyKind traverses the pluginSpec and returns the first 'kind' value it finds.
func GetProxyKind(pluginSpec interface{}) (string, error) {
	finder := &configfinder{}
	finder.find(reflect.ValueOf(pluginSpec))

	if finder.err != nil {
		return "", finder.err
	}

	return finder.foundKind, nil
}

// ValidateAndExtract finds a proxy in the pluginSpec where the 'kind' field matches the provided kind.
// It then unmarshals the corresponding 'spec' field into the config parameter.
func ValidateAndExtract(kind string, pluginSpec, config interface{}) error {
	if config != nil && reflect.TypeOf(config).Kind() != reflect.Ptr {
		return fmt.Errorf("config must be a pointer")
	}

	finder := &configfinder{
		targetKind: strings.ToLower(kind),
		config:     config,
	}
	finder.find(reflect.ValueOf(pluginSpec))
	return finder.err
}

type configfinder struct {
	err       error
	found     bool
	foundKind string

	config     any
	targetKind string
}

func (c *configfinder) find(v reflect.Value) {
	// Stop searching if we found what we were looking for or if an error occurred.
	if c.found || c.err != nil {
		return
	}

	if !v.IsValid() {
		return
	}

	v = getNextElem(v)

	switch v.Kind() {
	case reflect.Struct:
		c.findInStruct(v)
	case reflect.Map:
		c.findInMap(v)
	}
}

// findInStruct searches for a kind/spec within a struct.
func (c *configfinder) findInStruct(v reflect.Value) {
	kindValue, ok := getKindFromStruct(v)
	if ok {
		// A 'kind' field was found at this level. Decide what to do based on the mode.
		isExtractMode := c.targetKind != ""
		if isExtractMode {
			// In ValidateAndExtract mode, check if the kind matches our target.
			if strings.ToLower(kindValue) == c.targetKind {
				c.found = true
				spec := getConfigSpecInStruct(v)
				c.unmarshalConfig(spec)
				return
			}
		} else {
			// In GetKind mode, we just need the first kind we find.
			c.found = true
			c.foundKind = strings.ToLower(kindValue)
			return
		}
	}

	// If no kind was found, or it didn't match, search deeper in the struct's fields.
	for i := 0; i < v.NumField(); i++ {
		// Note: reflect will automatically handle not being able to inspect unexported fields.
		c.find(v.Field(i))
		if c.found || c.err != nil {
			return
		}
	}
}

// findInMap searches for a kind/spec within a map.
func (c *configfinder) findInMap(v reflect.Value) {
	if v.Type().Key().Kind() != reflect.String {
		return
	}

	kindValue, ok := getKindFromMap(v)
	if ok {
		// A 'kind' field was found at this level.
		isExtractMode := c.targetKind != ""
		if isExtractMode {
			// In ValidateAndExtract mode, check if the kind matches our target.
			if strings.ToLower(kindValue) == c.targetKind {
				c.found = true
				spec := getConfigSpecInMap(v)
				c.unmarshalConfig(spec)
				return
			}
		} else {
			// In GetKind mode, we just need the first kind we find.
			c.found = true
			c.foundKind = strings.ToLower(kindValue)
			return
		}
	}

	// If no kind was found, or it didn't match, search deeper in the map's values.
	for _, key := range v.MapKeys() {
		c.find(v.MapIndex(key))
		if c.found || c.err != nil {
			return
		}
	}
}

func (c *configfinder) unmarshalConfig(spec reflect.Value) {
	if !spec.IsValid() {
		return
	}
	// If config is nil, we don't need to unmarshal.
	if c.config == nil {
		return
	}

	spec = getNextElem(spec)
	var data []byte
	data, c.err = json.Marshal(spec.Interface())
	if c.err != nil {
		return
	}

	c.err = json.Unmarshal(data, c.config)
}

// getKindFromStruct extracts the string value of the 'kind' field from a struct, if it exists.
func getKindFromStruct(v reflect.Value) (string, bool) {
	field := v.FieldByNameFunc(func(name string) bool {
		return strings.ToLower(name) == ProxyKindField
	})
	if field.IsValid() && field.CanInterface() && field.Kind() == reflect.String {
		return field.String(), true
	}
	return "", false
}

// getKindFromMap extracts the string value of the 'kind' field from a map, if it exists.
func getKindFromMap(v reflect.Value) (string, bool) {
	for _, key := range v.MapKeys() {
		if strings.ToLower(key.String()) == ProxyKindField {
			value := v.MapIndex(key)
			value = getNextElem(value)
			if value.Kind() == reflect.String {
				return value.String(), true
			}
		}
	}
	return "", false
}

// getConfigSpecInStruct extracts the 'spec' field from a struct.
func getConfigSpecInStruct(v reflect.Value) reflect.Value {
	return v.FieldByNameFunc(func(name string) bool {
		return strings.ToLower(name) == ProxySpec
	})
}

// getConfigSpecInMap extracts the 'spec' field from a map.
func getConfigSpecInMap(v reflect.Value) reflect.Value {
	for _, key := range v.MapKeys() {
		if strings.ToLower(key.String()) == ProxySpec {
			return v.MapIndex(key)
		}
	}
	return reflect.Value{}
}

func getNextElem(v reflect.Value) reflect.Value {
	if v.Kind() == reflect.Interface || (v.Kind() == reflect.Ptr && !v.IsNil()) {
		return v.Elem()
	}
	return v
}
