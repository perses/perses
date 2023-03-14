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
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"
	"time"

	jsoniter "github.com/json-iterator/go"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
)

type GetFunc func() (api.Entity, error)
type UpsertFunc func() error

func CreateGetFunc(t *testing.T, persistenceManager dependency.PersistenceManager, object interface{}) (GetFunc, UpsertFunc) {
	var getFunc GetFunc
	var upsertFunc UpsertFunc
	switch entity := object.(type) {
	case *v1.Project:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetProject().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetProject().Update(entity)
		}
	case *v1.Datasource:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetDatasource().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetDatasource().Update(entity)
		}
	case *v1.GlobalDatasource:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetGlobalDatasource().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetGlobalDatasource().Update(entity)
		}
	case *v1.Dashboard:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetDashboard().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetDashboard().Update(entity)
		}
	default:
		t.Fatalf("%T is not managed", object)
	}
	return getFunc, upsertFunc
}

func CreateAndWaitUntilEntitiesExist(t *testing.T, persistenceManager dependency.PersistenceManager, objects ...interface{}) {
	for _, object := range objects {
		CreateAndWaitUntilEntityExists(t, persistenceManager, object)
	}
}
func CreateAndWaitUntilEntityExists(t *testing.T, persistenceManager dependency.PersistenceManager, object interface{}) {
	getFunc, upsertFunc := CreateGetFunc(t, persistenceManager, object)

	// it appears that (maybe because of the tiny short between a deletion order and a creation order),
	// an entity actually created in database could be removed by a previous delete order.
	// In order to avoid that we will upsert the entity multiple times.
	// Also, we can have some delay between the order to create the document and the actual creation. so let's wait sometimes
	nbTimeToCreate := 3
	var err error
	for i := 0; i < nbTimeToCreate; i++ {
		if err := upsertFunc(); err != nil {
			t.Fatal(err)
		}
		j := 0
		for _, err = getFunc(); err != nil && j < 30; _, err = getFunc() {
			j++
			time.Sleep(2 * time.Second)
		}
	}
	if err != nil {
		t.Fatal(err)
	}
}

func NewProject(name string) *v1.Project {
	entity := &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: name,
		}}
	entity.Metadata.CreateNow()
	return entity
}

func newDatasourceSpec(t *testing.T) v1.DatasourceSpec {
	promURL, err := url.Parse("https://prometheus.demo.do.prometheus.io")
	if err != nil {
		t.Fatal(err)
	}
	json := jsoniter.ConfigCompatibleWithStandardLibrary
	pluginSpec := &datasource.Prometheus{
		Proxy: datasourceHTTP.Proxy{
			Kind: "HTTPProxy",
			Spec: datasourceHTTP.Config{
				URL: promURL,
				AllowedEndpoints: []datasourceHTTP.AllowedEndpoint{
					{
						EndpointPattern: common.MustNewRegexp("/api/v1/labels"),
						Method:          http.MethodPost,
					},
					{
						EndpointPattern: common.MustNewRegexp("/api/v1/series"),
						Method:          http.MethodPost,
					},
					{
						EndpointPattern: common.MustNewRegexp("/api/v1/metadata"),
						Method:          http.MethodGet,
					},
					{
						EndpointPattern: common.MustNewRegexp("/api/v1/query"),
						Method:          http.MethodPost,
					},
					{
						EndpointPattern: common.MustNewRegexp("/api/v1/query_range"),
						Method:          http.MethodPost,
					},
					{
						EndpointPattern: common.MustNewRegexp("/api/v1/label/([a-zA-Z0-9_-]+)/values"),
						Method:          http.MethodGet,
					},
				},
			},
		},
	}
	data, err := json.Marshal(pluginSpec)
	if err != nil {
		t.Fatal(err)
	}
	var pluginSpecAsMapInterface map[string]interface{}
	if err := json.Unmarshal(data, &pluginSpecAsMapInterface); err != nil {
		t.Fatal(err)
	}
	return v1.DatasourceSpec{
		Default: false,
		Plugin: common.Plugin{
			Kind: "PrometheusDatasource",
			Spec: pluginSpecAsMapInterface,
		},
	}
}

func NewDatasource(t *testing.T, projectName string, name string) *v1.Datasource {
	entity := &v1.Datasource{
		Kind: v1.KindDatasource,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: name,
			},
			Project: projectName,
		},
		Spec: newDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewGlobalDatasource(t *testing.T, name string) *v1.GlobalDatasource {
	entity := &v1.GlobalDatasource{
		Kind: v1.KindGlobalDatasource,
		Metadata: v1.Metadata{
			Name: name,
		},
		Spec: newDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewDashboard(t *testing.T, projectName string, name string) *v1.Dashboard {
	json := jsoniter.ConfigCompatibleWithStandardLibrary
	// Creating a full dashboard is quite long and to ensure the changes are still matching the dev environment,
	// it's better to use the dashboard written in the dev/data/dashboard.json
	persesRepositoryPath := GetRepositoryPath(t)
	dashboardJSONFilePath := filepath.Join(persesRepositoryPath, "dev", "data", "dashboard.json")
	var list []*v1.Dashboard
	data, err := os.ReadFile(dashboardJSONFilePath)
	if err != nil {
		t.Fatal(err)
	}
	if unmarshallErr := json.Unmarshal(data, &list); unmarshallErr != nil {
		t.Fatal(unmarshallErr)
	}
	if len(list) == 0 {
		t.Fatal("dashboard list is empty")
	}
	dashboard := list[0]
	dashboard.Metadata.Name = name
	dashboard.Metadata.Project = projectName
	return dashboard
}
