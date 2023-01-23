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
	"net/http/httptest"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/core/middleware"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/dependency"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func GetRepositoryPath(t *testing.T) string {
	projectPathByte, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
	if err != nil {
		t.Fatal(err)
	}
	return strings.TrimSpace(string(projectPathByte))
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
		Folder:        "./test",
		FileExtension: config.JSONExtension,
	}
}

func CreateServer(t *testing.T) (*httptest.Server, *httpexpect.Expect, dependency.PersistenceManager) {
	projectPath := GetRepositoryPath(t)
	handler := echo.New()
	conf := config.Config{
		Database: config.Database{
			File: defaultFileConfig(),
		},
		Schemas: config.Schemas{
			PanelsPath:      filepath.Join(projectPath, config.DefaultPanelsPath),
			QueriesPath:     filepath.Join(projectPath, config.DefaultQueriesPath),
			DatasourcesPath: filepath.Join(projectPath, config.DefaultDatasourcesPath),
			VariablesPath:   filepath.Join(projectPath, config.DefaultVariablesPath),
			Interval:        0,
		},
	}
	persistenceManager, err := dependency.NewPersistenceManager(conf.Database)
	if err != nil {
		t.Fatal(err)
	}
	serviceManager, err := dependency.NewServiceManager(persistenceManager, conf)
	if err != nil {
		t.Fatal(err)
	}
	handler.Use(middleware.CheckProject(serviceManager.GetProject()))
	persesAPI := core.NewPersesAPI(serviceManager, conf)
	persesAPI.RegisterRoute(handler)
	server := httptest.NewServer(handler)
	return server, httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	}), persistenceManager
}

func WithServer(t *testing.T, testFunc func(*httpexpect.Expect, dependency.PersistenceManager) []modelAPI.Entity) {
	server, expect, persistenceManager := CreateServer(t)
	defer server.Close()
	entities := testFunc(expect, persistenceManager)
	ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)
}
