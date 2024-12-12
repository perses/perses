// Copyright 2021 The Perses Authors
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
	"github.com/perses/perses/pkg/model/api"
)

func TestMainScenarioDatasource(t *testing.T) {
	e2eframework.MainTestScenarioWithProject(t, utils.PathDatasource, func(projectName string, name string) (api.Entity, api.Entity) {
		return e2eframework.NewProject(projectName), e2eframework.NewDatasource(t, projectName, name)
	})
}

func TestCreateDatasourceWithEmptyProjectName(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		entity := e2eframework.NewDatasource(t, "", "myDTS")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathDatasource)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{}
	})
}

func TestCreateDatasourceWithNonExistingProject(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		entity := e2eframework.NewDatasource(t, "awesomeProjectThatDoesntExist", "myDTS")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathDatasource)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{}
	})
}
