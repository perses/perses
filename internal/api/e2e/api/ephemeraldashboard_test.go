// Copyright 2024 The Perses Authors
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
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestMainScenarioEphemeralDashboard(t *testing.T) {
	e2eframework.MainTestScenarioWithProject(t, utils.PathEphemeralDashboard, func(projectName string, name string) (api.Entity, api.Entity) {
		return e2eframework.NewProject(projectName), e2eframework.NewEphemeralDashboard(t, projectName, name)
	})
}

func TestCreateEphemeralDashboardWithWrongName(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		entity := e2eframework.NewEphemeralDashboard(t, "perses", "Incorrect Name With Space")
		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)

		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, "perses", utils.PathEphemeralDashboard)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{project}
	})
}

func TestUpdateEphemeralDashboardIncreaseVersion(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		entity := e2eframework.NewEphemeralDashboard(t, "perses", "test")
		project := e2eframework.NewProject("perses")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)

		ephemeralDashboard := extractEphemeralDashboardFromHTTPBody(expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, entity.Metadata.Project, utils.PathEphemeralDashboard)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw(), t)

		updatedEphemeralDashboard := extractEphemeralDashboardFromHTTPBody(expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, ephemeralDashboard.Metadata.Project, utils.PathEphemeralDashboard, ephemeralDashboard.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw(), t)
		assert.True(t, ephemeralDashboard.Metadata.Version+1 == updatedEphemeralDashboard.Metadata.Version)

		updatedEphemeralDashboard = extractEphemeralDashboardFromHTTPBody(expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, ephemeralDashboard.Metadata.Project, utils.PathEphemeralDashboard, ephemeralDashboard.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK).
			JSON().
			Raw(), t)

		assert.True(t, ephemeralDashboard.Metadata.Version+2 == updatedEphemeralDashboard.Metadata.Version)
		return []api.Entity{project, entity}
	})
}

func TestListEphemeralDashboardInEmptyProject(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		demoEphemeralDashboard := e2eframework.NewEphemeralDashboard(t, "perses", "Demo")
		persesProject := e2eframework.NewProject("perses")
		demoProject := e2eframework.NewProject("Demo")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager, persesProject, demoProject, demoEphemeralDashboard)

		expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, demoProject.GetMetadata().GetName(), utils.PathEphemeralDashboard)).
			Expect().
			Status(http.StatusOK).
			JSON().
			Array().
			Length().
			IsEqual(0)

		return []api.Entity{persesProject, demoProject, demoEphemeralDashboard}
	})
}

func extractEphemeralDashboardFromHTTPBody(body interface{}, t *testing.T) *modelV1.EphemeralDashboard {
	b := testUtils.JSONMarshalStrict(body)
	ephemeralDashboard := &modelV1.EphemeralDashboard{}
	testUtils.JSONUnmarshal(b, ephemeralDashboard)
	return ephemeralDashboard
}
