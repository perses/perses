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
	"os"
	"path/filepath"
	"testing"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/provisioning"
	testUtils "github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/stretchr/testify/assert"
)

func TestProvisioningSkipsResourcesInUnknownProject(t *testing.T) {
	conf := e2eframework.DefaultConfig()
	_, _, manager := e2eframework.CreateServer(t, conf)
	defer manager.Persistence().GetPersesDAO().Close()

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

	e2eframework.ClearAllKeys(t, manager.Persistence().GetPersesDAO(), existingProject, roleInExistingProject)
}

func writeEntityToFile(t *testing.T, path string, entity modelAPI.Entity) {
	t.Helper()
	if err := os.WriteFile(path, testUtils.JSONMarshalStrict(entity), 0600); err != nil {
		t.Fatal(err)
	}
}
