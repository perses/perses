// Copyright The Perses Authors
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
	"path/filepath"
	"slices"
	"strings"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/ephemeraldashboard"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/common"
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

// generateProjectResourceQuery returns the folders of the project resources of the given kind, restricted to the
// given project if not empty, and to the given list of projects if not empty.
func (d *DAO) generateProjectResourceQuery(kind v1.Kind, project string, projects []string) ([]string, error) {
	if len(project) > 0 {
		if len(projects) > 0 && !d.containsProject(projects, project) {
			return nil, nil
		}
		projects = []string{project}
	}
	if len(projects) == 0 {
		// It's used when we query a list of object. It can happen that the project is empty.
		return []string{filepath.Join(d.Folder, v1.PluralKindMap[kind])}, nil
	}
	folders := make([]string, 0, len(projects))
	for _, p := range projects {
		if err := common.ValidateID(p); err != nil {
			return nil, &databaseModel.Error{Key: p, Code: databaseModel.ErrorBadRequest}
		}
		folders = append(folders, filepath.Join(d.Folder, v1.PluralKindMap[kind], p))
	}
	return folders, nil
}

func (d *DAO) containsProject(projects []string, project string) bool {
	if d.CaseSensitive {
		return slices.Contains(projects, project)
	}
	return slices.ContainsFunc(projects, func(p string) bool { return strings.EqualFold(p, project) })
}

func (d *DAO) generateResourceQuery(kind v1.Kind) string {
	return filepath.Join(d.Folder, v1.PluralKindMap[kind])
}

// buildQuery returns the folders containing the resources matching the query (they may not exist), and the prefix of
// the name of these resources.
func (d *DAO) buildQuery(query databaseModel.Query) (pathFolders []string, prefix string, err error) {
	switch qt := query.(type) {
	case *dashboard.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindDashboard, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *datasource.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindDatasource, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *ephemeraldashboard.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindEphemeralDashboard, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *folder.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindFolder, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *globaldatasource.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindGlobalDatasource)}
		prefix = qt.NamePrefix
	case *globalrole.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindGlobalRole)}
		prefix = qt.NamePrefix
	case *globalrolebinding.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindGlobalRoleBinding)}
		prefix = qt.NamePrefix
	case *globalsecret.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindGlobalSecret)}
		prefix = qt.NamePrefix
	case *globalvariable.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindGlobalVariable)}
		prefix = qt.NamePrefix
	case *project.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindProject)}
		prefix = qt.NamePrefix
	case *role.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindRole, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *rolebinding.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindRoleBinding, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *secret.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindSecret, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	case *user.Query:
		pathFolders = []string{d.generateResourceQuery(v1.KindUser)}
		prefix = qt.NamePrefix
	case *variable.Query:
		pathFolders, err = d.generateProjectResourceQuery(v1.KindVariable, qt.Project, qt.Projects)
		prefix = qt.NamePrefix
	default:
		return nil, "", fmt.Errorf("this type of query '%T' is not managed", qt)
	}
	if err != nil {
		return nil, "", err
	}
	if !d.CaseSensitive {
		for i := range pathFolders {
			pathFolders[i] = strings.ToLower(pathFolders[i])
		}
		prefix = strings.ToLower(prefix)
	}
	return pathFolders, prefix, nil
}
