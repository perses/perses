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
	"testing"

	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/pkg/model/api"
)

func TestMainScenarioDatasource(t *testing.T) {
	e2eframework.MainTestScenarioWithProject(t, shared.PathDatasource, func(projectName string, name string) (api.Entity, api.Entity) {
		return e2eframework.NewProject(projectName), e2eframework.NewDatasource(t, projectName, name)
	})
}

func TestCreateDatasourceWithEmptyProjectName(t *testing.T) {

	dts := utils.NewDatasource(t)
	dts.Metadata.Project = ""
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// metadata.name is not provided, it should return a bad request
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathDatasource)).
		WithJSON(dts).
		Expect().
		Status(http.StatusBadRequest)
}

func TestCreateDatasourceWithNonExistingProject(t *testing.T) {
	dts := utils.NewDatasource(t)
	dts.Metadata.Project = "404NotFound"
	server, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// metadata.name is not provided, it should return a bad request
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathDatasource)).
		WithJSON(dts).
		Expect().
		Status(http.StatusBadRequest)
}
