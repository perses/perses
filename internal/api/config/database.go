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

package config

import (
	"fmt"
)

type FileExtension string

const (
	YAMLExtension FileExtension = "yaml"
	JSONExtension FileExtension = "json"
)

type File struct {
	Folder    string        `json:"folder" yaml:"folder"`
	Extension FileExtension `json:"extension" yaml:"extension"`
}

func (f *File) Verify() error {
	if len(f.Extension) == 0 {
		f.Extension = YAMLExtension
	}
	if f.Extension != YAMLExtension && f.Extension != JSONExtension {
		return fmt.Errorf("wrong file extension defined when using the filesystem as a database. You can only define json or yaml")
	}
	return nil
}

type Database struct {
	File *File `json:"file" yaml:"file"`
}
