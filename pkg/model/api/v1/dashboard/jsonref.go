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

package dashboard

import (
	"encoding/json"
	"fmt"
	"regexp"
)

var (
	// jsonRefMatching is only used to validate the whole reference.
	jsonRefMatching = regexp.MustCompile(`^#?/([a-zA-Z0-9_-]+)(?:/([a-zA-Z0-9_-]+))*$`)
	// jsonRefCapturedGroup is used to captured every part of the reference
	jsonRefCapturedGroup = regexp.MustCompile(`(?:/([a-zA-Z0-9_-]+))`)
)

type JSONRef struct {
	// Ref is the JSON reference. That's the only thing that is used during the marshalling / unmarshalling process.
	// Other attributes are ignored during these processes.
	Ref string `json:"$ref" yaml:"$ref"`
	// Path is a list of string that will be used to find from the root of the struct the object pointed.
	Path []string `json:"-" yaml:"-"`
	// Object will contain the pointer to the actual object referenced by Ref
	Object interface{} `json:"-" yaml:"-"`
}

func (j *JSONRef) UnmarshalJSON(data []byte) error {
	var tmp JSONRef
	type plain JSONRef
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*j = tmp
	return nil
}

func (j *JSONRef) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp JSONRef
	type plain JSONRef
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*j = tmp
	return nil
}

func (j *JSONRef) validate() error {
	if !jsonRefMatching.MatchString(j.Ref) {
		return fmt.Errorf("ref '%s' is not accepted", j.Ref)
	}
	for _, matches := range jsonRefCapturedGroup.FindAllStringSubmatch(j.Ref, -1) {
		for i := 1; i < len(matches); i++ {
			j.Path = append(j.Path, matches[i])
		}
	}
	return nil
}
