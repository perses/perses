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
)

func newDatasourceSpec(t *testing.T) v1.DatasourceSpec {
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

func newDashboard(t *testing.T, projectName string, dashboardName string, dtsName string) *v1.Dashboard {
	dts := newDatasourceSpec(t)
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
				dtsName: &dts,
			},
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func newDatasource(t *testing.T, projectName string, name string) *v1.Datasource {
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
		Spec: newDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newGlobalDatasource(t *testing.T, name string) *v1.GlobalDatasource {
	entity := &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: v1.Metadata{Name: name},
		Spec:     newDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func TestProxyGlobalDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "myDTS"
		dts := newGlobalDatasource(t, dtsName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/api/v1/status/config", utils.PathGlobalDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{dts}
	})
}

func TestProxyProjectDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "myDTS"
		projectName := "perses"
		dts := newDatasource(t, projectName, dtsName)
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dts)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/%s/%s/api/v1/status/config", utils.PathProject, projectName, utils.PathDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{project, dts}
	})
}

func TestProxyLocalDatasource(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		dtsName := "myDTS"
		dashboardName := "myDashboard"
		projectName := "perses"
		dashboard := newDashboard(t, projectName, dashboardName, dtsName)
		project := e2eframework.NewProject(projectName)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, dashboard)

		expect.GET(fmt.Sprintf("/proxy/%s/%s/%s/%s/%s/%s/api/v1/status/config", utils.PathProject, projectName, utils.PathDashboard, dashboardName, utils.PathDatasource, dtsName)).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{project, dashboard}
	})
}

func TestProxyLocalDatasourceWithRealDashboard(t *testing.T) {
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
