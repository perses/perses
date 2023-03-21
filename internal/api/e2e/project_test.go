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

package e2e

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/gavv/httpexpect/v2"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/pkg/model/api"
	"github.com/stretchr/testify/assert"
)

func TestMainScenarioProject(t *testing.T) {
	e2eframework.MainTestScenario(t, shared.PathProject, func(name string) api.Entity {
		return e2eframework.NewProject(name)
	})
}

func TestDeleteProjectWithSubResources(t *testing.T) {
	e2eframework.WithServer(t, func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		projectName := "perses"
		dash := e2eframework.NewDashboard(t, "perses", "Demo")
		project := e2eframework.NewProject(projectName)
		datasource := e2eframework.NewDatasource(t, "perses", "Demo")
		e2eframework.CreateAndWaitUntilEntitiesExist(t, manager, project, dash, datasource)
		expect.DELETE(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathProject, projectName)).
			Expect().
			Status(http.StatusNoContent)

		_, err := manager.GetDashboard().Get(projectName, dash.Metadata.Name)
		assert.True(t, databaseModel.IsKeyNotFound(err))
		_, err = manager.GetDatasource().Get(projectName, datasource.Metadata.Name)
		assert.True(t, databaseModel.IsKeyNotFound(err))
		return []api.Entity{}
	})
}
