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

//go:build integration

package e2eframework

import (
	"encoding/hex"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/core"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/prometheus/client_golang/prometheus"
	promConfig "github.com/prometheus/common/config"
)

var useSQL = os.Getenv("PERSES_TEST_USE_SQL")

func DefaultConfig() config.Config {
	projectPath := test.GetRepositoryPath()
	return config.Config{
		Security: config.Security{
			Readonly:      false,
			EnableAuth:    false,
			Authorization: config.AuthorizationConfig{},
			Authentication: config.AuthenticationConfig{
				AccessTokenTTL:  config.DefaultAccessTokenTTL,
				RefreshTokenTTL: config.DefaultRefreshTokenTTL,
			},
			EncryptionKey: promConfig.Secret(hex.EncodeToString([]byte("=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"))),
		},
		Schemas: config.Schemas{
			PanelsPath:      filepath.Join(projectPath, config.DefaultPanelsPath),
			QueriesPath:     filepath.Join(projectPath, config.DefaultQueriesPath),
			DatasourcesPath: filepath.Join(projectPath, config.DefaultDatasourcesPath),
			VariablesPath:   filepath.Join(projectPath, config.DefaultVariablesPath),
			Interval:        0,
		},
	}
}

func ClearAllKeys(t *testing.T, dao databaseModel.DAO, entities ...modelAPI.Entity) {
	for _, entity := range entities {
		err := dao.Delete(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
		if err != nil {
			t.Fatal(err)
		}
	}
}

func defaultFileConfig() *config.File {
	return &config.File{
		Folder:    "./test",
		Extension: config.JSONExtension,
	}
}

func CreateServer(t *testing.T, conf config.Config) (*httptest.Server, *httpexpect.Expect, dependency.PersistenceManager) {
	if useSQL == "true" {
		conf.Database = config.Database{
			SQL: &config.SQL{
				User:                 "user",
				Password:             "password",
				Net:                  "tcp",
				Addr:                 "localhost:3306",
				DBName:               "perses",
				AllowNativePasswords: true,
			},
		}
	} else {
		conf.Database = config.Database{
			File: defaultFileConfig(),
		}
	}
	runner, persistenceManager, err := core.New(conf, "")
	if err != nil {
		t.Fatal(err)
	}
	handler, err := runner.HTTPServerBuilder().PrometheusRegisterer(prometheus.NewRegistry()).BuildHandler()
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(handler)
	return server, httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	}), persistenceManager
}

func WithServer(t *testing.T, testFunc func(*httpexpect.Expect, dependency.PersistenceManager) []modelAPI.Entity) {
	conf := DefaultConfig()
	server, expect, persistenceManager := CreateServer(t, conf)
	defer persistenceManager.GetPersesDAO().Close()
	defer server.Close()
	entities := testFunc(expect, persistenceManager)
	ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)
}

func WithServerConfig(t *testing.T, config config.Config, testFunc func(*httpexpect.Expect, dependency.PersistenceManager) []modelAPI.Entity) {
	server, expect, persistenceManager := CreateServer(t, config)
	defer persistenceManager.GetPersesDAO().Close()
	defer server.Close()
	entities := testFunc(expect, persistenceManager)
	ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)
}
