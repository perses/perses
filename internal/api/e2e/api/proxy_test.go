// Copyright 2025 The Perses Authors
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

package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
	datasourceSQL "github.com/perses/perses/pkg/model/api/v1/datasource/sql"
)

func newHTTPDatasourceSpec(t *testing.T) v1.DatasourceSpec {
	promURL, err := common.ParseURL("http://localhost:9090")
	if err != nil {
		t.Fatal(err)
	}

	pluginSpec := &datasource.Prometheus{
		Proxy: &datasourceHTTP.Proxy{
			Kind: "HTTPProxy",
			Spec: datasourceHTTP.Config{
				URL: promURL,
			},
		},
	}

	data, err := json.Marshal(pluginSpec)
	if err != nil {
		t.Fatal(err)
	}
	var pluginSpecAsMapInterface map[string]interface{}
	if umarshallErr := json.Unmarshal(data, &pluginSpecAsMapInterface); umarshallErr != nil {
		t.Fatal(umarshallErr)
	}

	return v1.DatasourceSpec{
		Default: false,
		Plugin: common.Plugin{
			Kind: "PrometheusDatasource",
			Spec: pluginSpecAsMapInterface,
		},
	}
}

func newSQLDatasourceSpec(t *testing.T) v1.DatasourceSpec {
	pluginSpec := &datasource.Postgres{
		Proxy: &datasourceSQL.Proxy{
			Kind: "SQLProxy",
			Spec: datasourceSQL.Config{
				Driver:   "postgres",
				Host:     "localhost:5432",
				Database: "perses",
				Postgres: &datasourceSQL.PostgresConfig{
					SSLMode: datasourceSQL.SSLModePreferable,
				},
			},
		},
	}

	data, err := json.Marshal(pluginSpec)
	if err != nil {
		t.Fatal(err)
	}
	var pluginSpecAsMapInterface map[string]interface{}
	if umarshallErr := json.Unmarshal(data, &pluginSpecAsMapInterface); umarshallErr != nil {
		t.Fatal(umarshallErr)
	}

	return v1.DatasourceSpec{
		Default: false,
		Plugin: common.Plugin{
			Kind: "PostgresDatasource",
			Spec: pluginSpecAsMapInterface,
		},
	}
}

func newDashboard(projectName string, dashboardName string, dtsName string, dts *v1.Datasource) *v1.Dashboard {
	entity := &v1.Dashboard{
		Kind: v1.KindDashboard,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: dashboardName,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: v1.DashboardSpec{
			Datasources: map[string]*v1.DatasourceSpec{
				dtsName: &dts.Spec,
			},
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func newHTTPDatasource(t *testing.T, projectName string, name string) *v1.Datasource {
	entity := &v1.Datasource{
		Kind: v1.KindDatasource,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: name,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: newHTTPDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newSQLDatasource(t *testing.T, projectName string, name string) *v1.Datasource {
	entity := &v1.Datasource{
		Kind: v1.KindDatasource,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: name,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: newSQLDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newGlobalHTTPDatasource(t *testing.T, name string) *v1.GlobalDatasource {
	entity := &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
		Spec:     newHTTPDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newGlobalSQLDatasource(t *testing.T, name string) *v1.GlobalDatasource {
	entity := &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
		Spec:     newSQLDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func TestHTTPProxyGlobalDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "myDTS"
		dts := newGlobalHTTPDatasource(t, dtsName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/api/v1/status/config", utils.PathGlobalDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{dts}
	})
}

func TestSQLProxyBadMethod(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "mySQLDTS"
		dts := newGlobalSQLDatasource(t, dtsName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.GET(fmt.Sprintf("/proxy/%s/%s", utils.PathGlobalDatasource, dtsName)).
			Expect().
			Status(http.StatusMethodNotAllowed)
		return []api.Entity{dts}
	})
}

func TestSQLProxyGlobalDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		// set the postgres user password since the secret isn't working in the test
		t.Setenv("PGUSER", "user")
		t.Setenv("PGPASSWORD", "password")
		dtsName := "mySQLDTS"
		dts := newGlobalSQLDatasource(t, dtsName)
		s := e2eframework.NewGlobalSecret(dtsName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, s)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.POST(fmt.Sprintf("/proxy/%s/%s", utils.PathGlobalDatasource, dtsName)).
			WithBytes([]byte(fmt.Sprintf(`{"query": "SELECT datname FROM pg_database"}`))).
			Expect().
			Status(http.StatusOK).
			Body().
			IsEqual("datname\npostgres\nperses\ntemplate1\ntemplate0\n")
		return []api.Entity{dts}
	})
}

func TestHTTPProxyProjectDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "myDTS"
		projectName := "perses"
		dts := newHTTPDatasource(t, projectName, dtsName)
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/%s/%s/api/v1/status/config", utils.PathProject, projectName, utils.PathDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{project, dts}
	})
}

func TestSQLProxyProjectDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		// set the postgres user password since the secret isn't working in the test
		t.Setenv("PGUSER", "user")
		t.Setenv("PGPASSWORD", "password")
		dtsName := "mySQLDTS"
		projectName := "perses"
		dts := newSQLDatasource(t, projectName, dtsName)
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.POST(fmt.Sprintf("/proxy/%s/%s/%s/%s", utils.PathProject, projectName, utils.PathDatasource, dtsName)).
			WithBytes([]byte(fmt.Sprintf(`{"query": "SELECT datname FROM pg_database"}`))).
			Expect().
			Status(http.StatusOK).
			Body().
			IsEqual("datname\npostgres\nperses\ntemplate1\ntemplate0\n")
		return []api.Entity{project, dts}
	})
}

func TestHTTPProxyLocalDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "myDTS"
		dashboardName := "myDashboard"
		projectName := "perses"
		dts := newHTTPDatasource(t, projectName, dtsName)
		dashboard := newDashboard(projectName, dashboardName, dtsName, dts)
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dashboard)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/%s/%s/%s/%s/api/v1/status/config", utils.PathProject, projectName, utils.PathDashboard, dashboardName, utils.PathDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{project, dashboard}
	})
}

func TestSQLProxyLocalDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		// set the postgres user password since the secret isn't working in the test
		t.Setenv("PGUSER", "user")
		t.Setenv("PGPASSWORD", "password")
		dtsName := "mySQLDTS"
		dashboardName := "myDashboard"
		projectName := "perses"
		dts := newSQLDatasource(t, projectName, dtsName)
		dashboard := newDashboard(projectName, dashboardName, dtsName, dts)
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dashboard)

		expect.POST(fmt.Sprintf("/proxy/%s/%s/%s/%s/%s/%s", utils.PathProject, projectName, utils.PathDashboard, dashboardName, utils.PathDatasource, dtsName)).
			WithBytes([]byte(fmt.Sprintf(`{"query": "SELECT datname FROM pg_database"}`))).
			Expect().
			Status(http.StatusOK).
			Body().
			IsEqual("datname\npostgres\nperses\ntemplate1\ntemplate0\n")
		return []api.Entity{project, dashboard}
	})
}

func TestHTTPProxyLocalDatasourceWithRealDashboard(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		var dashboard v1.Dashboard
		testUtils.JSONUnmarshalFromFile(filepath.Join("testdata", "dashboard.json"), &dashboard)
		dtsName := "Victoria Metrics"
		dashboardName := "myDashboard"
		projectName := "perses"
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, &dashboard)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/%s/%s/%s/%s/api/v1/status/config", utils.PathProject, projectName, utils.PathDashboard, dashboardName, utils.PathDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{project, &dashboard}
	})
}
