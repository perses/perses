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

	"github.com/perses/common/config"
)

type FileExtension string

const (
	YAMLExtension FileExtension = "yaml"
	JSONExtension FileExtension = "json"
)

type File struct {
	Folder        string        `json:"folder" yaml:"folder"`
	FileExtension FileExtension `json:"file_extension" yaml:"file_extension"`
}

func (f *File) Verify() error {
	if len(f.FileExtension) == 0 {
		f.FileExtension = YAMLExtension
	}
	if f.FileExtension != YAMLExtension && f.FileExtension != JSONExtension {
		return fmt.Errorf("wrong file extension defined when using the filesystem as a database. You can only define json or yaml")
	}
	return nil
}

type Database struct {
	File *File              `json:"file,omitempty" yaml:"file,omitempty"`
	Etcd *config.EtcdConfig `json:"etcd,omitempty" yaml:"etcd,omitempty"`
}

func (d *Database) Verify() error {
	if d.File == nil && d.Etcd == nil {
		return fmt.Errorf("you must specify if Perses has to use ETCD or filesystem as a database")
	}
	if d.File != nil && d.Etcd != nil {
		return fmt.Errorf("you cannot tel to Perses to use ETCD and the filesystem at the same time")
	}
	return nil
}
