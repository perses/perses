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

	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/perses/perses/pkg/model/api/v1/datasource/sql"
)

const (
	ProxyKindField = "kind"
	ProxySpec      = "spec"
)

// ValidateAndExtract finds a proxy in the pluginSpec
// It then unmarshals the corresponding 'spec' field into the config interace{}.
func ValidateAndExtract(pluginSpec any) (any, string, error) {
	finder := &configFinder{}
	finder.find(reflect.ValueOf(pluginSpec))

	return finder.config, finder.foundKind, finder.err
}

type configFinder struct {
	err       error
	found     bool
	foundKind string

	config any
}

func (c *configFinder) find(v reflect.Value) {
	if c.err != nil || !v.IsValid() {
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
func (c *configFinder) findInStruct(v reflect.Value) {
	// first look at the field and find if we have the good kind
	c.foundKind, c.found = getKindFromStruct(v)
	if c.found {
		// then get the spec field
		spec := getConfigSpecInStruct(v)
		// Then unmarshal the proxy to validate the content
		c.unmarshalConfig(spec)
	} else {
		// Otherwise look deeper to find it
		for i := 0; i < v.NumField(); i++ {
			c.find(v.Field(i))
			if c.found || c.err != nil {
				return
			}
		}
	}
}

// findInMap assumed that v is of type reflect.Map
func (c *configFinder) findInMap(v reflect.Value) {
	keyType := v.Type().Key()
	if keyType.Kind() != reflect.String {
		return
	}

	c.foundKind, c.found = getKindFromMap(v)
	if c.found {
		// then get the spec field
		spec := getConfigSpecInMap(v)
		// Then unmarshal the proxy to validate the content
		c.unmarshalConfig(spec)
	} else {
		// Otherwise look deeper to find it
		for _, key := range v.MapKeys() {
			c.find(v.MapIndex(key))
			if c.found || c.err != nil {
				return
			}
		}
	}
}

func (c *configFinder) unmarshalConfig(spec reflect.Value) {
	if !spec.IsValid() {
		return
	}

	spec = getNextElem(spec)
	var data []byte
	data, c.err = json.Marshal(spec.Interface())
	if c.err != nil {
		return
	}

	switch c.foundKind {
	case http.ProxyKindName:
		c.config = &http.Config{}
		c.err = json.Unmarshal(data, c.config)
	case sql.ProxyKindName:
		c.config = &sql.Config{}
		c.err = json.Unmarshal(data, c.config)
	default:
		c.err = fmt.Errorf("proxy %q not managed", c.foundKind)
	}
}

// getKindFromStruct extracts the string value of the 'kind' field from a struct, if it exists.
func getKindFromStruct(v reflect.Value) (string, bool) {
	field := v.FieldByNameFunc(func(name string) bool {
		return strings.ToLower(name) == ProxyKindField
	})
	if field.IsValid() && field.CanInterface() && field.Kind() == reflect.String {
		kindValue := strings.ToLower(field.String())
		if kindValue == http.ProxyKindName || kindValue == sql.ProxyKindName {
			return kindValue, true
		}
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
				kindValue := strings.ToLower(value.String())
				if kindValue == http.ProxyKindName || kindValue == sql.ProxyKindName {
					return kindValue, true
				}
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
