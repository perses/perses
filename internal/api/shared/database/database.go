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

package database

import (
	"fmt"

	"github.com/perses/perses/internal/api/config"
	databaseFile "github.com/perses/perses/internal/api/shared/database/file"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
)

func New(conf config.Database) (databaseModel.DAO, error) {
	if conf.File != nil {
		return &databaseFile.DAO{
			Folder:    conf.File.Folder,
			Extension: conf.File.Extension,
		}, nil
	}
	return nil, fmt.Errorf("no dao defined")
}
