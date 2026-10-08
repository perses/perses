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

//go:build integration

package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/stretchr/testify/assert"
)

func TestMainScenarioDashboard(t *testing.T) {
	e2eframework.MainTestScenarioWithProject(t, utils.PathDashboard, func(projectName string, name string) (api.Entity, api.Entity) {
		return e2eframework.NewProject(projectName), e2eframework.NewDashboard(t, projectName, name)
	})
}

func TestCreateDashboardWithWrongName(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		entity := e2eframework.NewDashboard(t, "perses", "Incorrect Name With Space")
		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), project)

		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, "perses", utils.PathDashboard)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{project}
	})
}

func TestUpdateDashboardIncreaseVersion(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		entity := e2eframework.NewDashboard(t, "perses", "test")
		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), project)

		dashboard := extractDashboardFromHTTPBody(expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, entity.Metadata.Project, utils.PathDashboard)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw())

		updatedDashboard := extractDashboardFromHTTPBody(expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, dashboard.Metadata.Project, utils.PathDashboard, dashboard.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw())
		assert.True(t, dashboard.Metadata.Version+1 == updatedDashboard.Metadata.Version)

		updatedDashboard = extractDashboardFromHTTPBody(expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, dashboard.Metadata.Project, utils.PathDashboard, dashboard.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw())

		assert.True(t, dashboard.Metadata.Version+2 == updatedDashboard.Metadata.Version)
		return []api.Entity{project, entity}
	})
}

func TestListDashboardInEmptyProject(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		demoDashboard := e2eframework.NewDashboard(t, "perses", "Demo")
		persesProject := e2eframework.NewProject("perses")
		demoProject := e2eframework.NewProject("Demo")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), persesProject, demoProject, demoDashboard)

		expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, demoProject.GetMetadata().GetName(), utils.PathDashboard)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(0)

		return []api.Entity{persesProject, demoProject, demoDashboard}
	})
}

func TestListDashboardWithOnlyMetadata(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		demoDashboard := e2eframework.NewDashboard(t, "perses", "Demo")
		persesProject := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), persesProject, demoDashboard)

		response := expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, persesProject.GetMetadata().GetName(), utils.PathDashboard)).
			WithQuery("metadata_only", true).
			Expect().
			Status(http.StatusOK)

		response.JSON().Array().Length().IsEqual(1)
		response.JSON().Array().Value(0).Object().IsEqual(modelV1.PartialProjectEntity{
			Kind:     demoDashboard.Kind,
			Metadata: demoDashboard.Metadata,
			Spec:     struct{}{},
		})

		return []api.Entity{persesProject, demoDashboard}
	})
}

func extractDashboardFromHTTPBody(body interface{}) *modelV1.Dashboard {
	b := testUtils.JSONMarshalStrict(body)
	dashboard := &modelV1.Dashboard{}
	testUtils.JSONUnmarshal(b, dashboard)
	return dashboard
}

func TestAuthListDashboardInProject(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {

		usrEntity := e2eframework.NewUser("creator", "password")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}
		authResponse := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthnKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsAll("access_token", "refresh_token")
		token := authResponse.JSON().Object().Value("access_token").String().Raw()

		firstProject := e2eframework.NewProject("first")
		secondProject := e2eframework.NewProject("second")
		thirdProject := e2eframework.NewProject("third")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), firstProject, secondProject, thirdProject)
		expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathDashboard)).
			WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(0)

		expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, firstProject.GetMetadata().GetName(), utils.PathDashboard)).
			WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(0)

		firstDashboard := e2eframework.NewDashboard(t, firstProject.Metadata.Name, "Demo-1")
		secondDashboard := e2eframework.NewDashboard(t, secondProject.Metadata.Name, "Demo-2")
		thirdDashboard := e2eframework.NewDashboard(t, thirdProject.Metadata.Name, "Demo-3")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), firstDashboard, secondDashboard, thirdDashboard)

		expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathDashboard)).
			WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(3)

		expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, firstProject.GetMetadata().GetName(), utils.PathDashboard)).
			WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(1)

		e2eframework.ClearAllKeys(t, manager.Persistence().GetPersesDAO(), usrEntity)
		return []api.Entity{firstProject, secondProject, thirdProject, firstDashboard, secondDashboard, thirdDashboard}
	})
}

// newDatasourceSpecWithSecret builds a local datasource spec whose HTTP proxy references a secret.
func newDatasourceSpecWithSecret(t *testing.T, secretName string) *datasourceSpec.Spec {
	spec := e2eframework.NewDatasource(t, "perses", "withSecret").Spec
	pluginSpec, ok := spec.Plugin.Spec.(map[string]interface{})
	if !ok {
		t.Fatalf("unexpected datasource plugin spec type %T", spec.Plugin.Spec)
	}
	proxy, ok := pluginSpec["proxy"].(map[string]interface{})
	if !ok {
		t.Fatalf("unexpected datasource proxy type %T", pluginSpec["proxy"])
	}
	proxySpec, ok := proxy["spec"].(map[string]interface{})
	if !ok {
		t.Fatalf("unexpected datasource proxy spec type %T", proxy["spec"])
	}
	proxySpec["secret"] = secretName
	return &spec
}

// TestDashboardWithSecretDatasourceRequiresSecretReadPermission verifies that creating or updating a dashboard
// that embeds a local datasource referencing a secret is forbidden unless the user is allowed to read secrets
// in the project.
func TestDashboardWithSecretDatasourceRequiresSecretReadPermission(t *testing.T) {
	conf := e2eframework.DefaultAuthConfig()
	// Guest permissions are restricted to dashboards only, so that nobody can read secrets by default.
	conf.Security.Authorization.Provider.Native.GuestPermissions = []*role.Permission{
		{
			Actions: []role.Action{role.CreateAction, role.ReadAction, role.UpdateAction, role.DeleteAction},
			Scopes:  []role.Scope{role.DashboardScope},
		},
	}
	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager) []api.Entity {
		usrEntity := e2eframework.NewUser("bob", "password")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}
		authResponse := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthnKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)
		token := authResponse.JSON().Object().Value("access_token").String().Raw()
		authHeaderKey, authHeaderValue := e2eframework.CreateAuthorizationHeader(token)

		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), project)

		dashboardPath := fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, project.Metadata.Name, utils.PathDashboard)

		// A dashboard embedding a datasource that references a secret
		dashboardWithSecret := e2eframework.NewDashboard(t, project.Metadata.Name, "withSecret")
		dashboardWithSecret.Spec.Datasources = map[string]*datasourceSpec.Spec{
			"promWithSecret": newDatasourceSpecWithSecret(t, "mySecret"),
		}

		// Creating a dashboard that references a secret without the secret read permission must be forbidden
		expect.POST(dashboardPath).
			WithHeader(authHeaderKey, authHeaderValue).
			WithJSON(dashboardWithSecret).
			Expect().
			Status(http.StatusForbidden)

		// Creating a dashboard without any secret reference is still allowed
		dashboardWithoutSecret := e2eframework.NewDashboard(t, project.Metadata.Name, "withSecret")
		dashboardWithoutSecret.Spec.Datasources = nil
		expect.POST(dashboardPath).
			WithHeader(authHeaderKey, authHeaderValue).
			WithJSON(dashboardWithoutSecret).
			Expect().
			Status(http.StatusOK)

		// Updating the dashboard to reference a secret without the secret read permission must be forbidden
		expect.PUT(fmt.Sprintf("%s/%s", dashboardPath, dashboardWithSecret.Metadata.Name)).
			WithHeader(authHeaderKey, authHeaderValue).
			WithJSON(dashboardWithSecret).
			Expect().
			Status(http.StatusForbidden)

		// Grant the secret read permission to the user in the project
		secretReaderRole := &modelV1.Role{
			Kind:     modelV1.KindRole,
			Metadata: *modelV1.NewProjectMetadata(project.Metadata.Name, "secret-reader"),
			Spec: modelV1.RoleSpec{
				Permissions: []role.Permission{
					{
						Actions: []role.Action{role.ReadAction},
						Scopes:  []role.Scope{role.SecretScope},
					},
				},
			},
		}
		secretReaderRole.Metadata.CreateNow()
		secretReaderRoleBinding := &modelV1.RoleBinding{
			Kind:     modelV1.KindRoleBinding,
			Metadata: *modelV1.NewProjectMetadata(project.Metadata.Name, "secret-reader"),
			Spec: modelV1.RoleBindingSpec{
				Role: secretReaderRole.Metadata.Name,
				Subjects: []modelV1.Subject{
					{
						Kind: modelV1.KindUser,
						Name: usrEntity.Metadata.Name,
					},
				},
			},
		}
		secretReaderRoleBinding.Metadata.CreateNow()
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager.Persistence(), secretReaderRole, secretReaderRoleBinding)
		if err := manager.Service().GetAuthorization().RefreshPermissionsAndRoles(); err != nil {
			t.Fatalf("failed to refresh permissions: %v", err)
		}

		// Now the update referencing a secret must be accepted
		expect.PUT(fmt.Sprintf("%s/%s", dashboardPath, dashboardWithSecret.Metadata.Name)).
			WithHeader(authHeaderKey, authHeaderValue).
			WithJSON(dashboardWithSecret).
			Expect().
			Status(http.StatusOK)

		// And creating a new dashboard referencing a secret must be accepted as well
		otherDashboardWithSecret := e2eframework.NewDashboard(t, project.Metadata.Name, "otherWithSecret")
		otherDashboardWithSecret.Spec.Datasources = map[string]*datasourceSpec.Spec{
			"promWithSecret": newDatasourceSpecWithSecret(t, "mySecret"),
		}
		expect.POST(dashboardPath).
			WithHeader(authHeaderKey, authHeaderValue).
			WithJSON(otherDashboardWithSecret).
			Expect().
			Status(http.StatusOK)

		e2eframework.ClearAllKeys(t, manager.Persistence().GetPersesDAO(), usrEntity)
		return []api.Entity{project, dashboardWithSecret, otherDashboardWithSecret, secretReaderRole, secretReaderRoleBinding}
	})
}
