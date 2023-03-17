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

package databaseSQL

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"reflect"

	"github.com/huandu/go-sqlbuilder"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

const (
	tableGlobalDatasource = "globaldatasource"
	tableProject          = "project"
	tableDashboard        = "dashboard"
	tableFolder           = "folder"
	tableDatasource       = "datasource"

	colID      = "id"
	colDoc     = "doc"
	colName    = "name"
	colProject = "project"
)

func getTableName(kind modelV1.Kind) (string, error) {
	switch kind {
	case modelV1.KindDashboard:
		return tableDashboard, nil
	case modelV1.KindDatasource:
		return tableDatasource, nil
	case modelV1.KindFolder:
		return tableFolder, nil
	case modelV1.KindGlobalDatasource:
		return tableGlobalDatasource, nil
	case modelV1.KindProject:
		return tableProject, nil
	default:
		return "", fmt.Errorf("%q has no associated table", kind)
	}
}

func generateID(metadata modelAPI.Metadata) (string, error) {
	switch m := metadata.(type) {
	case *modelV1.ProjectMetadata:
		return fmt.Sprintf("%s|%s", m.Project, m.Name), nil
	case *modelV1.Metadata:
		return m.Name, nil
	}
	return "", fmt.Errorf("metadata %T not managed", metadata)
}

type DAO struct {
	databaseModel.DAO
	DB         *sql.DB
	SchemaName string
}

func (d *DAO) Init() error {
	globalDatasource := d.createResourceTable(tableGlobalDatasource)
	project := d.createResourceTable(tableProject)

	dashboard := d.createProjectResourceTable(tableDashboard)
	folder := d.createProjectResourceTable(tableFolder)
	datasource := d.createProjectResourceTable(tableDatasource)

	if err := d.createTable(globalDatasource); err != nil {
		return err
	}
	if err := d.createTable(project); err != nil {
		return err
	}
	if err := d.createTable(dashboard); err != nil {
		return err
	}
	if err := d.createTable(folder); err != nil {
		return err
	}
	return d.createTable(datasource)
}

func (d *DAO) createResourceTable(tableName string) string {
	return sqlbuilder.CreateTable(d.generateCompleteTableName(tableName)).IfNotExists().
		Define(colID, "VARCHAR(128)", "NOT NULL", "PRIMARY KEY").
		Define(colName, "VARCHAR(128)", "NOT NULL").
		Define(colDoc, "JSON", "NOT NULL").
		String()
}

func (d *DAO) createProjectResourceTable(tableName string) string {
	return sqlbuilder.CreateTable(d.generateCompleteTableName(tableName)).IfNotExists().
		Define(colID, "VARCHAR(256)", "NOT NULL", "PRIMARY KEY").
		Define(colName, "VARCHAR(128)", "NOT NULL").
		Define(colProject, "VARCHAR(128)", "NOT NULL").
		Define(colDoc, "JSON", "NOT NULL").
		String()
}

func (d *DAO) createTable(query string) error {
	r, e := d.DB.Query(query)
	if e != nil {
		return e
	}
	return r.Close()
}

func (d *DAO) Close() error {
	return d.DB.Close()
}

func (d *DAO) Create(entity modelAPI.Entity) error {
	id, isExist, err := d.exists(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	if err != nil {
		return err
	}
	if isExist {
		return &databaseModel.Error{Key: id, Code: databaseModel.ErrorCodeConflict}
	}

	sqlQuery, args, queryErr := d.generateInsertQuery(entity)
	if queryErr != nil {
		return queryErr
	}

	createQuery, createErr := d.DB.Query(sqlQuery, args...)
	if createErr != nil {
		return createErr
	}
	return createQuery.Close()
}

func (d *DAO) Upsert(entity modelAPI.Entity) error {
	_, isExist, err := d.exists(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	if err != nil {
		return err
	}
	var sqlQuery string
	var args []interface{}
	var queryGeneratorErr error
	if !isExist {
		sqlQuery, args, queryGeneratorErr = d.generateInsertQuery(entity)
	} else {
		sqlQuery, args, queryGeneratorErr = d.generateUpdateQuery(entity)
	}
	if queryGeneratorErr != nil {
		return queryGeneratorErr
	}
	upsertQuery, upsertErr := d.DB.Query(sqlQuery, args...)
	if upsertErr != nil {
		return upsertErr
	}
	return upsertQuery.Close()
}

func (d *DAO) Get(kind modelV1.Kind, metadata modelAPI.Metadata, entity modelAPI.Entity) error {
	id, query, queryErr := d.get(kind, metadata)
	if queryErr != nil {
		return queryErr
	}
	defer query.Close()
	if query.Next() {
		var rowJSONDoc string
		if scanErr := query.Scan(&rowJSONDoc); scanErr != nil {
			return scanErr
		}
		return json.Unmarshal([]byte(rowJSONDoc), entity)
	}
	return &databaseModel.Error{Key: id, Code: databaseModel.ErrorCodeNotFound}
}

func (d *DAO) Query(query databaseModel.Query, slice interface{}) error {
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
	q, args, buildQueryErr := d.buildQuery(query)
	if buildQueryErr != nil {
		return fmt.Errorf("unable to build the query: %s", buildQueryErr)
	}
	rows, runQueryErr := d.DB.Query(q, args...)
	if runQueryErr != nil {
		return runQueryErr
	}
	defer rows.Close()
	for rows.Next() {
		var rowJSONDoc string
		if scanErr := rows.Scan(&rowJSONDoc); scanErr != nil {
			return scanErr
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
		if unmarshalErr := json.Unmarshal([]byte(rowJSONDoc), obj); unmarshalErr != nil {
			return unmarshalErr
		}
		if typeParameter.Elem().Kind() != reflect.Ptr {
			// In case the type of the slice element is not a pointer,
			// we should return the value of the pointer created in the previous step.
			sliceElem.Set(reflect.Append(sliceElem, value.Elem()))
		} else {
			sliceElem.Set(reflect.Append(sliceElem, value))
		}
	}
	if sliceElem.Len() == 0 {
		// in case the result is empty, let's initialize the slice just to avoid returning a nil slice
		sliceElem = reflect.MakeSlice(typeParameter, 0, 0)
	}
	// at the end reset the element of the slice to ensure we didn't disconnect the link between the pointer to the slice and the actual slice
	result.Elem().Set(sliceElem)
	return nil
}

func (d *DAO) Delete(kind modelV1.Kind, metadata modelAPI.Metadata) error {
	id, isExist, err := d.exists(kind, metadata)
	if err != nil {
		return err
	}
	if !isExist {
		return &databaseModel.Error{Key: id, Code: databaseModel.ErrorCodeNotFound}
	}

	id, tableName, idErr := d.getIDAndTableName(kind, metadata)
	if idErr != nil {
		return idErr
	}

	deleteBuilder := sqlbuilder.NewDeleteBuilder().DeleteFrom(tableName)
	deleteBuilder.Where(deleteBuilder.Equal(colID, id))
	sqlQuery, args := deleteBuilder.Build()

	deleteQuery, err := d.DB.Query(sqlQuery, args...)
	if err != nil {
		return err
	}
	return deleteQuery.Close()
}

func (d *DAO) HealthCheck() bool {
	if err := d.DB.Ping(); err != nil {
		logrus.WithError(err).Error("unable to ping the database")
		return false
	}
	return true
}

func (d *DAO) getIDAndTableName(kind modelV1.Kind, metadata modelAPI.Metadata) (string, string, error) {
	tableName, tableErr := getTableName(kind)
	if tableErr != nil {
		return "", "", tableErr
	}
	id, generateIDErr := generateID(metadata)
	if generateIDErr != nil {
		return "", "", generateIDErr
	}
	return id, d.generateCompleteTableName(tableName), nil
}

// generateCompleteTableName concat the tableName and the DBName. This should be used everytime a FROM condition is used.
func (d *DAO) generateCompleteTableName(tableName string) string {
	return fmt.Sprintf("%s.%s", d.SchemaName, tableName)
}

func (d *DAO) exists(kind modelV1.Kind, metadata modelAPI.Metadata) (string, bool, error) {
	id, query, queryErr := d.get(kind, metadata)
	if queryErr != nil {
		return "", false, queryErr
	}
	defer query.Close()
	return id, query.Next(), nil
}

func (d *DAO) get(kind modelV1.Kind, metadata modelAPI.Metadata) (string, *sql.Rows, error) {
	id, tableName, idErr := d.getIDAndTableName(kind, metadata)
	if idErr != nil {
		return "", nil, idErr
	}

	queryBuilder := sqlbuilder.NewSelectBuilder().
		Select(colDoc).
		From(tableName)
	queryBuilder.Where(queryBuilder.Equal(colID, id))
	sqlQuery, args := queryBuilder.Build()

	rows, err := d.DB.Query(sqlQuery, args...)
	return id, rows, err
}
