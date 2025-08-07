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
	e2eframework.WithServerAuthConfig(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []api.Entity {
		project := e2eframework.NewProject("mysuperproject")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), project)
		role := e2eframework.NewRole(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), role)
		roleBiding := e2eframework.NewRoleBinding(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), roleBiding)
		// Refresh the permissions to ensure Alice has the latest permissions
		err := manager.Service().GetAuthorization().RefreshPermissions()
		if err != nil {
			t.Fatalf("failed to refresh permissions: %v", err)
		}

		entity := e2eframework.NewRoleBinding(project.Metadata.Name, "foo")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathRoleBinding)).
			WithHeader(e2eframework.CreateAuthorizationHeader(token)).
			WithJSON(entity).
			Expect().
			Status(http.StatusOK)
		return []api.Entity{entity, role, roleBiding, project}
	})
}

func TestUpdateScenarioRoleBindingRole(t *testing.T) {
	e2eframework.WithServerAuthConfig(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.Manager, token string) []api.Entity {
		// First we need to provide the necessary permissions to Alice so she can create a GlobalRoleBinding
		// We create a GlobalRole and a GlobalRoleBinding for Alice
		project := e2eframework.NewProject("mysuperproject")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), project)
		role := e2eframework.NewRole(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), role)
		entity := e2eframework.NewRoleBinding(project.Metadata.Name, "admin")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), entity)
		// Refresh the permissions to ensure Alice has the latest permissions
		err := manager.Service().GetAuthorization().RefreshPermissions()
		if err != nil {
			t.Fatalf("failed to refresh permissions: %v", err)
		}

		entity.Spec.Role = "newRoleName"
		expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.PathProject, entity.Metadata.Project, utils.APIV1Prefix, utils.PathRoleBinding, entity.Metadata.Name)).
			WithHeader(e2eframework.CreateAuthorizationHeader(token)).
			WithJSON(entity).
			Expect().
			Status(http.StatusBadRequest)
		return []api.Entity{entity, role, project}
	})
}
