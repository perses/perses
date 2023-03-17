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
	"database/sql"
	"fmt"

	"github.com/go-sql-driver/mysql"
	"github.com/perses/perses/internal/api/config"
	databaseFile "github.com/perses/perses/internal/api/shared/database/file"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	databaseSQL "github.com/perses/perses/internal/api/shared/database/sql"
)

func New(conf config.Database) (databaseModel.DAO, error) {
	if conf.File != nil {
		return &databaseFile.DAO{
			Folder:    conf.File.Folder,
			Extension: conf.File.Extension,
		}, nil
	} else if conf.SQL != nil {
		c := conf.SQL
		mysqlConfig := mysql.Config{
			User:                     c.User,
			Passwd:                   c.Password,
			Net:                      c.Net,
			Addr:                     c.Addr,
			DBName:                   c.DBName,
			Collation:                c.Collation,
			Loc:                      c.Loc,
			MaxAllowedPacket:         c.MaxAllowedPacket,
			ServerPubKey:             c.ServerPubKey,
			Timeout:                  c.Timeout,
			ReadTimeout:              c.ReadTimeout,
			WriteTimeout:             c.WriteTimeout,
			AllowAllFiles:            c.AllowAllFiles,
			AllowCleartextPasswords:  c.AllowCleartextPasswords,
			AllowFallbackToPlaintext: c.AllowFallbackToPlaintext,
			AllowNativePasswords:     c.AllowNativePasswords,
			AllowOldPasswords:        c.AllowOldPasswords,
			CheckConnLiveness:        c.CheckConnLiveness,
			ClientFoundRows:          c.ClientFoundRows,
			ColumnsWithAlias:         c.ColumnsWithAlias,
			InterpolateParams:        c.InterpolateParams,
			MultiStatements:          c.MultiStatements,
			ParseTime:                c.ParseTime,
			RejectReadOnly:           c.RejectReadOnly,
		}

		db, err := sql.Open("mysql", mysqlConfig.FormatDSN())
		if err != nil {
			return nil, err
		}
		return &databaseSQL.DAO{
			DB:         db,
			SchemaName: c.DBName,
		}, nil
	}
	return nil, fmt.Errorf("no dao defined")
}
