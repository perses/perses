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

package databasesql

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/huandu/go-sqlbuilder"
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
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func generateProjectResourceInsertQuery(tableName string, id string, rowJSONDoc []byte, metadata *modelV1.ProjectMetadata) (string, []any) {
	return sqlbuilder.NewInsertBuilder().
		InsertInto(tableName).
		Cols(colID, colName, colProject, colDoc).
		Values(id, metadata.Name, metadata.Project, rowJSONDoc).
		Build()
}

func generateResourceInsertQuery(tableName string, id string, rowJSONDoc []byte, metadata *modelV1.Metadata) (string, []any) {
	return sqlbuilder.NewInsertBuilder().
		InsertInto(tableName).
		Cols(colID, colName, colDoc).
		Values(id, metadata.Name, rowJSONDoc).
		Build()
}

func (d *DAO) generateInsertQuery(entity modelAPI.Entity) (string, []any, error) {
	id, tableName, idErr := d.getIDAndTableName(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	if idErr != nil {
		return "", nil, idErr
	}
	rowJSONDoc, unmarshalErr := json.Marshal(entity)
	if unmarshalErr != nil {
		return "", nil, unmarshalErr
	}
	var sql string
	var args []any
	switch m := entity.GetMetadata().(type) {
	case *modelV1.ProjectMetadata:
		sql, args = generateProjectResourceInsertQuery(tableName, id, rowJSONDoc, m)
	case *modelV1.Metadata:
		sql, args = generateResourceInsertQuery(tableName, id, rowJSONDoc, m)
	}
	return sql, args, nil
}

func (d *DAO) generateUpdateQuery(entity modelAPI.Entity) (string, []any, error) {
	id, tableName, idErr := d.getIDAndTableName(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	if idErr != nil {
		return "", nil, idErr
	}
	rowJSONDoc, unmarshalErr := json.Marshal(entity)
	if unmarshalErr != nil {
		return "", nil, unmarshalErr
	}
	builder := sqlbuilder.NewUpdateBuilder().Update(tableName)
	builder.Where(builder.Equal(colID, id))
	builder.Set(builder.Assign(colDoc, rowJSONDoc))
	sql, args := builder.Build()
	return sql, args, nil
}

// escapeLikePattern escapes the LIKE metacharacters ('%' and '_') and the
// escape character itself ('\') in s so they are matched literally. This keeps
// the SQL backend's name-prefix filter consistent with the file backend, which
// uses a literal strings.HasPrefix. MySQL uses '\' as the default LIKE escape
// character, so no explicit ESCAPE clause is required.
func escapeLikePattern(s string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return replacer.Replace(s)
}

func (d *DAO) generateSelectQuery(tableName string, project string, name string) (string, []any) {
	return d.generateSelectQueryWithSource(tableName, project, name, "")
}

func (d *DAO) generateSelectQueryWithSource(tableName string, project string, name string, sourceFolder string) (string, []any) {
	p := project
	n := name
	if !d.CaseSensitive {
		p = strings.ToLower(p)
		n = strings.ToLower(n)
	}
	queryBuilder := sqlbuilder.NewSelectBuilder().
		Select(colDoc).
		From(tableName)
	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", escapeLikePattern(n))))
	}
	if len(p) > 0 {
		queryBuilder.Where(queryBuilder.Equal(colProject, p))
	}
	if len(sourceFolder) > 0 {
		queryBuilder.Where(fmt.Sprintf("JSON_EXTRACT(%s, '$.source.provisioning.folder') = ?", colDoc), sourceFolder)
	}
	return queryBuilder.Build()
}

func (d *DAO) buildQuery(query databaseModel.Query) (string, []any, error) {
	var sqlQuery string
	var args []any
	switch qt := query.(type) {
	case *dashboard.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableDashboard), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *datasource.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableDatasource), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *ephemeraldashboard.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableEphemeralDashboard), qt.Project, qt.NamePrefix)
	case *folder.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableFolder), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *globaldatasource.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableGlobalDatasource), "", qt.NamePrefix, qt.SourceFolder)
	case *globalrole.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableGlobalRole), "", qt.NamePrefix, qt.SourceFolder)
	case *globalrolebinding.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableGlobalRoleBinding), "", qt.NamePrefix, qt.SourceFolder)
	case *globalsecret.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableGlobalSecret), "", qt.NamePrefix, qt.SourceFolder)
	case *globalvariable.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableGlobalVariable), "", qt.NamePrefix, qt.SourceFolder)
	case *project.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableProject), "", qt.NamePrefix, qt.SourceFolder)
	case *role.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableRole), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *rolebinding.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableRoleBinding), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *secret.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableSecret), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *user.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableUser), "", qt.NamePrefix, qt.SourceFolder)
	case *variable.Query:
		sqlQuery, args = d.generateSelectQueryWithSource(d.generateCompleteTableName(tableVariable), qt.Project, qt.NamePrefix, qt.SourceFolder)
	default:
		return "", nil, fmt.Errorf("this type of query '%T' is not managed", qt)
	}
	return sqlQuery, args, nil
}

func (d *DAO) generateDeleteQuery(tableName string, project string, name string) (string, []any) {
	return d.generateDeleteQueryWithSource(tableName, project, name, "")
}

func (d *DAO) generateDeleteQueryWithSource(tableName string, project string, name string, sourceFolder string) (string, []any) {
	p := project
	n := name
	if !d.CaseSensitive {
		p = strings.ToLower(p)
		n = strings.ToLower(n)
	}

	queryBuilder := sqlbuilder.NewDeleteBuilder().
		DeleteFrom(tableName)
	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", escapeLikePattern(n))))
	}
	if len(p) > 0 {
		queryBuilder.Where(queryBuilder.Equal(colProject, p))
	}
	if len(sourceFolder) > 0 {
		queryBuilder.Where(fmt.Sprintf("JSON_EXTRACT(%s, '$.source.provisioning.folder') = ?", colDoc), sourceFolder)
	}
	return queryBuilder.Build()
}

func (d *DAO) buildDeleteQuery(query databaseModel.Query) (string, []any, error) {
	var sqlQuery string
	var args []any
	switch qt := query.(type) {
	case *dashboard.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableDashboard), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *datasource.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableDatasource), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *ephemeraldashboard.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableEphemeralDashboard), qt.Project, qt.NamePrefix)
	case *folder.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableFolder), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *globaldatasource.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableGlobalDatasource), "", qt.NamePrefix, qt.SourceFolder)
	case *globalrole.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableGlobalRole), "", qt.NamePrefix, qt.SourceFolder)
	case *globalrolebinding.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableGlobalRoleBinding), "", qt.NamePrefix, qt.SourceFolder)
	case *globalsecret.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableGlobalSecret), "", qt.NamePrefix, qt.SourceFolder)
	case *globalvariable.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableGlobalVariable), "", qt.NamePrefix, qt.SourceFolder)
	case *project.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableProject), "", qt.NamePrefix, qt.SourceFolder)
	case *role.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableRole), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *rolebinding.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableRoleBinding), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *secret.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableSecret), qt.Project, qt.NamePrefix, qt.SourceFolder)
	case *user.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableUser), "", qt.NamePrefix, qt.SourceFolder)
	case *variable.Query:
		sqlQuery, args = d.generateDeleteQueryWithSource(d.generateCompleteTableName(tableVariable), qt.Project, qt.NamePrefix, qt.SourceFolder)
	default:
		return "", nil, fmt.Errorf("this type of query '%T' is not managed", qt)
	}
	return sqlQuery, args, nil
}
