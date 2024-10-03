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
	"encoding/json"
	"net/http"
	"path/filepath"
	"testing"
	"time"

	"github.com/perses/perses/internal/api/dependency"
	"github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource"
	datasourceHTTP "github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/perses/perses/pkg/model/api/v1/variable"
)

type GetFunc func() (api.Entity, error)
type UpsertFunc func() error

func CreateGetFunc(t *testing.T, persistenceManager dependency.PersistenceManager, object interface{}) (GetFunc, UpsertFunc) {
	var getFunc GetFunc
	var upsertFunc UpsertFunc
	switch entity := object.(type) {

	case *v1.Dashboard:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetDashboard().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetDashboard().Update(entity)
		}
	case *v1.Datasource:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetDatasource().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetDatasource().Update(entity)
		}
	case *v1.EphemeralDashboard:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetEphemeralDashboard().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetEphemeralDashboard().Update(entity)
		}
	case *v1.GlobalDatasource:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetGlobalDatasource().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetGlobalDatasource().Update(entity)
		}
	case *v1.GlobalRole:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetGlobalRole().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetGlobalRole().Update(entity)
		}
	case *v1.GlobalRoleBinding:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetGlobalRoleBinding().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetGlobalRoleBinding().Update(entity)
		}
	case *v1.GlobalSecret:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetGlobalSecret().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetGlobalSecret().Update(entity)
		}
	case *v1.GlobalVariable:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetGlobalVariable().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetGlobalVariable().Update(entity)
		}
	case *v1.Project:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetProject().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetProject().Update(entity)
		}
	case *v1.Role:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetRole().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetRole().Update(entity)
		}
	case *v1.RoleBinding:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetRoleBinding().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetRoleBinding().Update(entity)
		}
	case *v1.Secret:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetSecret().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetSecret().Update(entity)
		}
	case *v1.User:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetUser().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetUser().Update(entity)
		}
	case *v1.Variable:
		getFunc = func() (api.Entity, error) {
			return persistenceManager.GetVariable().Get(entity.Metadata.Project, entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetVariable().Update(entity)
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

	// It appears that (maybe because of the tiny short between a deletion order and a creation order),
	// an entity actually created in database could be removed by a previous delete order.
	// To avoid that we will upsert the entity multiple times.
	// Also, we can have some delay between the order to create the document and the actual creation.
	// So let's wait sometimes
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

func newProjectMetadata(projectName string, name string) v1.ProjectMetadata {
	return v1.ProjectMetadata{
		Metadata: v1.Metadata{
			Name: name,
		},
		ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
			Project: projectName,
		},
	}
}

func newMetadata(name string) v1.Metadata {
	return v1.Metadata{
		Name: name,
	}
}

func NewProject(name string) *v1.Project {
	entity := &v1.Project{
		Kind:     v1.KindProject,
		Metadata: newMetadata(name),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newDatasourceSpec(t *testing.T) v1.DatasourceSpec {
	promURL, err := common.ParseURL("https://prometheus.demo.do.prometheus.io")
	if err != nil {
		t.Fatal(err)
	}

	pluginSpec := &datasource.Prometheus{
		Proxy: &datasourceHTTP.Proxy{
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
		Kind:     v1.KindDatasource,
		Metadata: newProjectMetadata(projectName, name),
		Spec:     newDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewGlobalDatasource(t *testing.T, name string) *v1.GlobalDatasource {
	entity := &v1.GlobalDatasource{
		Kind:     v1.KindGlobalDatasource,
		Metadata: newMetadata(name),
		Spec:     newDatasourceSpec(t),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewVariable(projectName string, name string) *v1.Variable {
	entity := &v1.Variable{
		Kind:     v1.KindVariable,
		Metadata: newProjectMetadata(projectName, name),
		Spec: v1.VariableSpec{
			Kind: variable.KindList,
			Spec: &variable.ListSpec{
				Plugin: common.Plugin{
					Kind: "PrometheusLabelNamesVariable",
					Spec: map[string]interface{}{
						"matchers": []interface{}{
							"up",
						},
					},
				},
			},
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewGlobalVariable(name string) *v1.GlobalVariable {
	entity := &v1.GlobalVariable{
		Kind:     v1.KindGlobalVariable,
		Metadata: newMetadata(name),
		Spec: v1.VariableSpec{
			Kind: variable.KindList,
			Spec: &variable.ListSpec{
				Plugin: common.Plugin{
					Kind: "PrometheusLabelNamesVariable",
					Spec: map[string]interface{}{
						"matchers": []interface{}{
							"up",
						},
					},
				},
			},
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewDashboard(t *testing.T, projectName string, name string) *v1.Dashboard {
	// Creating a full dashboard is quite long and to ensure the changes are still matching the dev environment,
	// it's better to use the dashboard written in the dev/data/9-dashboard.json
	persesRepositoryPath := test.GetRepositoryPath()
	dashboardJSONFilePath := filepath.Join(persesRepositoryPath, "dev", "data", "9-dashboard.json")
	var list []*v1.Dashboard
	data := test.ReadFile(dashboardJSONFilePath)
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

func newRoleSpec() v1.RoleSpec {
	return v1.RoleSpec{
		Permissions: []role.Permission{
			{
				Actions: []role.Action{role.CreateAction},
				Scopes:  []role.Scope{role.VariableScope, role.DatasourceScope},
			},
		},
	}
}

func NewGlobalRole(name string) *v1.GlobalRole {
	entity := &v1.GlobalRole{
		Kind:     v1.KindGlobalRole,
		Metadata: newMetadata(name),
		Spec:     newRoleSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewRole(projectName string, name string) *v1.Role {
	entity := &v1.Role{
		Kind:     v1.KindRole,
		Metadata: newProjectMetadata(projectName, name),
		Spec:     newRoleSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newRoleBindingSpec() v1.RoleBindingSpec {
	return v1.RoleBindingSpec{
		Role: "admin",
		Subjects: []v1.Subject{
			{
				Kind: v1.KindUser,
				Name: "alice",
			},
		},
	}
}

func NewGlobalRoleBinding(name string) *v1.GlobalRoleBinding {
	entity := &v1.GlobalRoleBinding{
		Kind:     v1.KindGlobalRoleBinding,
		Metadata: newMetadata(name),
		Spec:     newRoleBindingSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewRoleBinding(projectName string, name string) *v1.RoleBinding {
	entity := &v1.RoleBinding{
		Kind:     v1.KindRoleBinding,
		Metadata: newProjectMetadata(projectName, name),
		Spec:     newRoleBindingSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func newSecretSpec() v1.SecretSpec {
	return v1.SecretSpec{
		BasicAuth: &secret.BasicAuth{
			Username: "Basil",
			Password: "Detective",
		},
		Authorization: nil,
		TLSConfig:     nil,
	}
}

func newPublicSecretSpec() v1.PublicSecretSpec {
	return v1.PublicSecretSpec{
		BasicAuth: &secret.PublicBasicAuth{
			Username: "Basil",
			Password: "<secret>",
		},
	}
}

func NewSecret(projectName string, name string) *v1.Secret {
	entity := &v1.Secret{
		Kind:     v1.KindSecret,
		Metadata: newProjectMetadata(projectName, name),
		Spec:     newSecretSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewPublicSecret(projectName string, name string) *v1.PublicSecret {
	entity := &v1.PublicSecret{
		Kind:     v1.KindSecret,
		Metadata: newProjectMetadata(projectName, name),
		Spec:     newPublicSecretSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewGlobalSecret(name string) *v1.GlobalSecret {
	entity := &v1.GlobalSecret{
		Kind:     v1.KindGlobalSecret,
		Metadata: newMetadata(name),
		Spec:     newSecretSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewPublicGlobalSecret(name string) *v1.PublicGlobalSecret {
	entity := &v1.PublicGlobalSecret{
		Kind:     v1.KindGlobalSecret,
		Metadata: newMetadata(name),
		Spec:     newPublicSecretSpec(),
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewUser(name string, password string) *v1.User {
	entity := &v1.User{
		Kind:     v1.KindUser,
		Metadata: newMetadata(name),
		Spec: v1.UserSpec{
			NativeProvider: v1.NativeProvider{
				Password: password,
			},
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewPublicUser(name string) *v1.PublicUser {
	entity := &v1.PublicUser{
		Kind:     v1.KindUser,
		Metadata: newMetadata(name),
		Spec: v1.PublicUserSpec{
			NativeProvider: v1.PublicNativeProvider{Password: "<secret>"},
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewEphemeralDashboard(t *testing.T, projectName string, name string) *v1.EphemeralDashboard {
	// Creating a full ephemeral dashboard is quite long and to ensure the changes are still matching the dev environment,
	// it's better to use the ephemeral dashboard written in the dev/data/ephemeraldashboard.json
	persesRepositoryPath := test.GetRepositoryPath()
	ephemeralDashboardJSONFilePath := filepath.Join(persesRepositoryPath, "dev", "data", "ephemeraldashboard.json")
	var list []*v1.EphemeralDashboard
	data := test.ReadFile(ephemeralDashboardJSONFilePath)
	if unmarshallErr := json.Unmarshal(data, &list); unmarshallErr != nil {
		t.Fatal(unmarshallErr)
	}
	if len(list) == 0 {
		t.Fatal("dashboard list is empty")
	}
	ephemeralDashboard := list[0]
	ephemeralDashboard.Metadata.Name = name
	ephemeralDashboard.Metadata.Project = projectName
	return ephemeralDashboard
}
