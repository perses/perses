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
	"context"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/provisioning"
	testUtils "github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/gavv/httpexpect/v2"
	"github.com/stretchr/testify/assert"
)

func TestProvisioningSkipsResourcesInUnknownProject(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, _ *httpexpect.Expect, manager dependency.Manager) []modelAPI.Entity {
		// Only "existingproject" is created. The provisioned roles below target
		// "existingproject" (must be provisioned) and "unknownproject" (must be refused).
		existingProject := e2eframework.NewProject("existingproject")
		e2eframework.CreateAndWaitUntilEntityExists(t, manager.Persistence(), existingProject)

		roleInExistingProject := e2eframework.NewRole("existingproject", "valid")
		roleInUnknownProject := e2eframework.NewRole("unknownproject", "orphan")

		provisioningDir := t.TempDir()
		writeEntityToFile(t, filepath.Join(provisioningDir, "valid.json"), roleInExistingProject)
		writeEntityToFile(t, filepath.Join(provisioningDir, "orphan.json"), roleInUnknownProject)

		if err := provisioning.New(manager.Service(), []string{provisioningDir}, true).Execute(context.Background(), func() {}); err != nil {
			t.Fatal(err)
		}

		// The role in the existing project is provisioned.
		_, err := manager.Persistence().GetRole().Get("existingproject", "valid")
		assert.NoError(t, err)

		// The role targeting a non-existing project is refused, not silently persisted.
		_, err = manager.Persistence().GetRole().Get("unknownproject", "orphan")
		assert.True(t, databaseModel.IsKeyNotFound(err), "role in an unknown project must not be provisioned, got err: %v", err)

		return []modelAPI.Entity{existingProject, roleInExistingProject}
	})
}

func TestProvisioningCreatesProjectBeforeItsResources(t *testing.T) {
	e2eframework.WithServer(t, func(_ *httptest.Server, _ *httpexpect.Expect, manager dependency.Manager) []modelAPI.Entity {
		// Both the project and a role belonging to it are provisioned in the same
		// batch, with no project pre-created. The role file is named so that
		// filepath.Walk reads it *before* the project file; the provisioning service
		// must still apply the project first so the role is not wrongly refused.
		project := e2eframework.NewProject("batchproject")
		roleInProject := e2eframework.NewRole("batchproject", "batchrole")

		provisioningDir := t.TempDir()
		writeEntityToFile(t, filepath.Join(provisioningDir, "a_role.json"), roleInProject)
		writeEntityToFile(t, filepath.Join(provisioningDir, "z_project.json"), project)

		if err := provisioning.New(manager.Service(), []string{provisioningDir}, true).Execute(context.Background(), func() {}); err != nil {
			t.Fatal(err)
		}

		_, err := manager.Persistence().GetProject().Get("batchproject")
		assert.NoError(t, err, "project declared in the same batch must be provisioned")

		_, err = manager.Persistence().GetRole().Get("batchproject", "batchrole")
		assert.NoError(t, err, "role must be provisioned once its project is created in the same batch")

		return []modelAPI.Entity{project, roleInProject}
	})
}

func writeEntityToFile(t *testing.T, path string, entity modelAPI.Entity) {
	t.Helper()
	if err := os.WriteFile(path, testUtils.JSONMarshalStrict(entity), 0600); err != nil {
		t.Fatal(err)
	}
}
