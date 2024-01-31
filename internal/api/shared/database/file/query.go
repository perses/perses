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
	"fmt"
	"os"
	"path"

	"github.com/perses/perses/internal/api/interface/v1/ephemeraldashboard"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"

	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func isFolderExist(folder string) (bool, error) {
	_, err := os.Stat(folder)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		logrus.WithError(err).Errorf("unexpected error while trying to access to the folder %q", folder)
		return false, err
	}
	return true, nil
}

func (d *DAO) generateProjectResourceQuery(kind v1.Kind, project string) string {
	if len(project) == 0 {
		// It's used when we query a list of object. It can happen that the project is empty.
		return path.Join(d.Folder, v1.PluralKindMap[kind])
	}
	return path.Join(d.Folder, v1.PluralKindMap[kind], project)
}

func (d *DAO) generateResourceQuery(kind v1.Kind) string {
	return path.Join(d.Folder, v1.PluralKindMap[kind])
}

func (d *DAO) buildQuery(query databaseModel.Query) (pathFolder string, prefix string, isExist bool, err error) {
	switch qt := query.(type) {
	case *dashboard.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindDashboard, qt.Project)
		prefix = qt.NamePrefix
	case *datasource.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindDatasource, qt.Project)
		prefix = qt.NamePrefix
	case *ephemeraldashboard.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindEphemeralDashboard, qt.Project)
		prefix = qt.NamePrefix
	case *folder.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindFolder, qt.Project)
		prefix = qt.NamePrefix
	case *globaldatasource.Query:
		pathFolder = d.generateResourceQuery(v1.KindGlobalDatasource)
		prefix = qt.NamePrefix
	case *globalrole.Query:
		pathFolder = d.generateResourceQuery(v1.KindGlobalRole)
		prefix = qt.NamePrefix
	case *globalrolebinding.Query:
		pathFolder = d.generateResourceQuery(v1.KindGlobalRoleBinding)
		prefix = qt.NamePrefix
	case *globalsecret.Query:
		pathFolder = d.generateResourceQuery(v1.KindGlobalSecret)
		prefix = qt.NamePrefix
	case *globalvariable.Query:
		pathFolder = d.generateResourceQuery(v1.KindGlobalVariable)
		prefix = qt.NamePrefix
	case *project.Query:
		pathFolder = d.generateResourceQuery(v1.KindProject)
		prefix = qt.NamePrefix
	case *role.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindRole, qt.Project)
		prefix = qt.NamePrefix
	case *rolebinding.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindRoleBinding, qt.Project)
		prefix = qt.NamePrefix
	case *secret.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindSecret, qt.Project)
		prefix = qt.NamePrefix
	case *user.Query:
		pathFolder = d.generateResourceQuery(v1.KindUser)
		prefix = qt.NamePrefix
	case *variable.Query:
		pathFolder = d.generateProjectResourceQuery(v1.KindVariable, qt.Project)
		prefix = qt.NamePrefix
	default:
		return "", "", false, fmt.Errorf("this type of query '%T' is not managed", qt)
	}
	isExist, err = isFolderExist(pathFolder)
	return
}
