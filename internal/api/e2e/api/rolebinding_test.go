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
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api"
)

func TestMainScenarioRoleBinding(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		user := e2eframework.NewUser("alice")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, user)
		project := e2eframework.NewProject("mysuperproject")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		role := e2eframework.NewRole(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, role)
		entity := e2eframework.NewRoleBinding(project.Metadata.Name, "admin")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathRoleBinding)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{entity, role, project, user}
	})
}

func TestUpdateScenarioRoleBindingRole(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
		user := e2eframework.NewUser("alice")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, user)
		project := e2eframework.NewProject("mysuperproject")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, project)
		role := e2eframework.NewRole(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, role)
		entity := e2eframework.NewRoleBinding(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, entity)

		entity.Spec.Role = "newRoleName"
		expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.PathProject, entity.Metadata.Project, utils.APIV1Prefix, utils.PathRoleBinding, entity.Metadata.Name)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{entity, role, project, user}
	})
}
