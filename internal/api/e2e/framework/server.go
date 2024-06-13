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
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/core"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/dependency"
	"github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/common/model"
)

var useSQL = os.Getenv("PERSES_TEST_USE_SQL")

func DefaultConfig() apiConfig.Config {
	projectPath := test.GetRepositoryPath()
	return apiConfig.Config{
		Security: apiConfig.Security{
			Readonly:      false,
			EnableAuth:    false,
			Authorization: apiConfig.AuthorizationConfig{},
			Authentication: apiConfig.AuthenticationConfig{
				AccessTokenTTL:  model.Duration(apiConfig.DefaultAccessTokenTTL),
				RefreshTokenTTL: model.Duration(apiConfig.DefaultRefreshTokenTTL),
				Providers:       apiConfig.AuthProviders{EnableNative: true},
			},
			EncryptionKey: secret.Hidden(hex.EncodeToString([]byte("=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"))),
		},
		EphemeralDashboard: apiConfig.EphemeralDashboard{
			Activate: true,
		},
		Schemas: apiConfig.Schemas{
			PanelsPath:      filepath.Join(projectPath, "cue", apiConfig.DefaultPanelsPath),
			QueriesPath:     filepath.Join(projectPath, "cue", apiConfig.DefaultQueriesPath),
			DatasourcesPath: filepath.Join(projectPath, "cue", apiConfig.DefaultDatasourcesPath),
			VariablesPath:   filepath.Join(projectPath, "cue", apiConfig.DefaultVariablesPath),
			Interval:        0,
		},
	}
}

func DefaultAuthConfig() apiConfig.Config {
	conf := DefaultConfig()
	conf.Security.EnableAuth = true
	conf.Security.Cookie = apiConfig.Cookie{
		SameSite: apiConfig.SameSite(http.SameSiteNoneMode),
		Secure:   true,
	}
	conf.Security.Authorization = apiConfig.AuthorizationConfig{GuestPermissions: []*role.Permission{
		{
			Actions: []role.Action{role.ReadAction},
			Scopes:  []role.Scope{role.WildcardScope},
		},
		{
			Actions: []role.Action{role.CreateAction},
			Scopes:  []role.Scope{role.ProjectScope},
		},
	}}
	return conf
}

func ClearAllKeys(t *testing.T, dao databaseModel.DAO, entities ...modelAPI.Entity) {
	for _, entity := range entities {
		err := dao.Delete(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
		if err != nil {
			t.Fatal(err)
		}
	}
}

func defaultFileConfig() *apiConfig.File {
	return &apiConfig.File{
		Folder:        "./test",
		Extension:     apiConfig.JSONExtension,
		CaseSensitive: true,
	}
}

func CreateServer(t *testing.T, conf apiConfig.Config) (*httptest.Server, *httpexpect.Expect, dependency.PersistenceManager) {
	if useSQL == "true" {
		conf.Database = apiConfig.Database{
			SQL: &apiConfig.SQL{
				User:                 "user",
				Password:             "password",
				Net:                  "tcp",
				Addr:                 "localhost:3306",
				DBName:               "perses",
				AllowNativePasswords: true,
				CaseSensitive:        true,
			},
		}
	} else {
		conf.Database = apiConfig.Database{
			File: defaultFileConfig(),
		}
	}
	registerer := prometheus.NewRegistry()
	runner, persistenceManager, err := core.New(conf, false, registerer, "")
	if err != nil {
		t.Fatal(err)
	}
	handler, err := runner.HTTPServerBuilder().BuildHandler()
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

func WithServerConfig(t *testing.T, config apiConfig.Config, testFunc func(*httpexpect.Expect, dependency.PersistenceManager) []modelAPI.Entity) {
	server, expect, persistenceManager := CreateServer(t, config)
	defer persistenceManager.GetPersesDAO().Close()
	defer server.Close()
	entities := testFunc(expect, persistenceManager)
	ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)
}
