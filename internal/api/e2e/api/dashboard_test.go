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

package api

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestMainScenarioDashboard(t *testing.T) {
	e2eframework.MainTestScenarioWithProject(t, utils.PathDashboard, func(projectName string, name string) (api.Entity, api.Entity) {
		return e2eframework.NewProject(projectName), e2eframework.NewDashboard(t, projectName, name)
	})
}

func TestCreateDashboardWithWrongName(t *testing.T) {
	e2eframework.WithServer(t, func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		entity := e2eframework.NewDashboard(t, "perses", "Incorrect Name With Space")
		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)

		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, "perses", utils.PathDashboard)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{project}
	})
}

func TestUpdateDashboardIncreaseVersion(t *testing.T) {
	e2eframework.WithServer(t, func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		entity := e2eframework.NewDashboard(t, "perses", "test")
		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)

		dashboard := extractDashboardFromHTTPBody(expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, entity.Metadata.Project, utils.PathDashboard)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw(), t)

		updatedDashboard := extractDashboardFromHTTPBody(expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, dashboard.Metadata.Project, utils.PathDashboard, dashboard.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw(), t)
		assert.True(t, dashboard.Metadata.Version+1 == updatedDashboard.Metadata.Version)

		updatedDashboard = extractDashboardFromHTTPBody(expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, dashboard.Metadata.Project, utils.PathDashboard, dashboard.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw(), t)

		assert.True(t, dashboard.Metadata.Version+2 == updatedDashboard.Metadata.Version)
		return []api.Entity{project, entity}
	})
}

func TestListDashboardInEmptyProject(t *testing.T) {
	e2eframework.WithServer(t, func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		demoDashboard := e2eframework.NewDashboard(t, "perses", "Demo")
		persesProject := e2eframework.NewProject("perses")
		demoProject := e2eframework.NewProject("Demo")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager, persesProject, demoProject, demoDashboard)

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

func extractDashboardFromHTTPBody(body interface{}, t *testing.T) *modelV1.Dashboard {
	b := testUtils.JSONMarshalStrict(body)
	dashboard := &modelV1.Dashboard{}
	testUtils.JSONUnmarshal(b, dashboard)
	return dashboard
}

func TestAuthListDashboardInProject(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {

		usrEntity := e2eframework.NewUser("creator")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}
		authResponse := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsAll("accessToken", "refreshToken")
		token := authResponse.JSON().Object().Value("accessToken").String().Raw()

		firstProject := e2eframework.NewProject("first")
		secondProject := e2eframework.NewProject("second")
		thirdProject := e2eframework.NewProject("third")
		firstDashboard := e2eframework.NewDashboard(t, firstProject.Metadata.Name, "Demo-1")
		secondDashboard := e2eframework.NewDashboard(t, secondProject.Metadata.Name, "Demo-2")
		thirdDashboard := e2eframework.NewDashboard(t, thirdProject.Metadata.Name, "Demo-3")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager, firstProject, secondProject, thirdProject, firstDashboard, secondDashboard, thirdDashboard)

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

		e2eframework.ClearAllKeys(t, manager.GetPersesDAO(), usrEntity)
		return []api.Entity{firstProject, secondProject, thirdProject, firstDashboard, secondDashboard, thirdDashboard}
	})
}
