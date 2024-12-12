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

package e2eframework

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	"github.com/perses/perses/internal/api/utils"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func CreateTestScenario(t *testing.T, path string, creator func(name string) modelAPI.Entity) {
	// Creation test : Perform the POST request
	t.Run("Creation", func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			entity := creator("myResource")

			expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusOK)

			return []modelAPI.Entity{entity}
		})
	})

	// Conflict test : Call again the same endpoint, it should now return a conflict error
	t.Run(fmt.Sprintf("Conflict test (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			entity := creator("myResource")
			CreateAndWaitUntilEntityExists(t, manager, entity)
			expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusConflict)

			return []modelAPI.Entity{entity}
		})
	})
}

func DeleteTestScenario(t *testing.T, path string, creator func(name string) modelAPI.Entity) {
	// Deletion test
	t.Run(fmt.Sprintf("Deletion test (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			entity := creator("myResource")
			CreateAndWaitUntilEntityExists(t, manager, entity)

			// For obscure reason, the check that entity exists can pass and not the deletion. As the deletion fails
			// silently, the GET right after can then return an unexpected 200. So we do an explicit wait to make sure
			// that the resource is well saved before delete
			time.Sleep(3 * time.Second)

			expect.DELETE(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, path, entity.GetMetadata().GetName())).
				Expect().
				Status(http.StatusNoContent)
			expect.GET(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, path, entity.GetMetadata().GetName())).
				Expect().
				Status(http.StatusNotFound)

			return []modelAPI.Entity{}
		})
	})
}

func NotFoundTestScenario(t *testing.T, path string, creator func(name string) modelAPI.Entity) {
	// "404 - Not found" tests
	t.Run(fmt.Sprintf("\"404 - Not found\" tests (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			entity := creator("not-existing")

			expect.GET(fmt.Sprintf("%s/%s/not-existing", utils.APIV1Prefix, path)).
				Expect().
				Status(http.StatusNotFound)
			expect.PUT(fmt.Sprintf("%s/%s/not-existing", utils.APIV1Prefix, path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusNotFound)
			expect.DELETE(fmt.Sprintf("%s/%s/not-existing", utils.APIV1Prefix, path)).
				Expect().
				Status(http.StatusNotFound)

			return []modelAPI.Entity{}
		})
	})
}

func WriteTestScenario(t *testing.T, path string, creator func(name string) modelAPI.Entity) {
	CreateTestScenario(t, path, creator)

	// Update test
	t.Run(fmt.Sprintf("Update test (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			entity := creator("myResource")
			CreateAndWaitUntilEntityExists(t, manager, entity)

			// call now the update endpoint, shouldn't return an error
			o := expect.PUT(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, path, entity.GetMetadata().GetName())).
				WithJSON(entity).
				Expect().
				Status(http.StatusOK).
				JSON().Raw()

			// To be able to compare the result, an easy way is to convert the map returned by the test framework.
			// So for that we have to first marshal again the data
			raw, err := json.Marshal(o)
			if err != nil {
				t.Fatal(err)
			}

			result, err := modelV1.GetStruct(modelV1.Kind(entity.GetKind()))
			if err != nil {
				t.Fatal(err)
			}
			if unmarshalErr := json.Unmarshal(raw, result); unmarshalErr != nil {
				t.Fatal(unmarshalErr)
			}

			assert.Equal(t, entity.GetSpec(), result.GetSpec())

			getFunc, _ := CreateGetFunc(t, manager, entity)
			// check the document exists in the db
			_, err = getFunc()
			assert.NoError(t, err)
			return []modelAPI.Entity{entity}
		})
	})

	DeleteTestScenario(t, path, creator)
}

func MainTestScenario(t *testing.T, path string, creator func(name string) modelAPI.Entity) {

	WriteTestScenario(t, path, creator)

	// Retrieval tests : Check all different GET methods
	t.Run(fmt.Sprintf("Retrieval tests (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			entity := creator("myResource")
			CreateAndWaitUntilEntityExists(t, manager, entity)
			// For the "get all" requests, we have no choice to wait a bit of time between the creation and the "get all"
			time.Sleep(3 * time.Second)

			// Check the retrieval of the entity among all the others
			expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
				Expect().
				Status(http.StatusOK).
				JSON().Array().ContainsAny(entity)

			// Check the retrieval of the entity by name
			expect.GET(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, path, entity.GetMetadata().GetName())).
				Expect().
				Status(http.StatusOK).
				JSON().IsEqual(entity)

			return []modelAPI.Entity{entity}
		})
	})

	NotFoundTestScenario(t, path, creator)
}

func CreateTestScenarioWithProject(t *testing.T, path string, creator func(projectName string, name string) (modelAPI.Entity, modelAPI.Entity)) {
	// Creation test : Perform the POST request
	t.Run("Creation", func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myProject", "myResource")
			CreateAndWaitUntilEntityExists(t, manager, parent)

			expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusOK)

			return []modelAPI.Entity{parent, entity}
		})
	})

	t.Run("Creation with project path", func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myProject", "myResource")
			CreateAndWaitUntilEntityExists(t, manager, parent)

			expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusOK)

			return []modelAPI.Entity{parent, entity}
		})
	})

	// Conflict test : Call again the same endpoint, it should now return a conflict error
	t.Run(fmt.Sprintf("Conflict test (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myProject", "myResource")
			CreateAndWaitUntilEntitiesExist(t, manager, parent, entity)

			expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusConflict)

			return []modelAPI.Entity{parent, entity}
		})
	})
}

func DeleteTestScenarioWithProject(t *testing.T, path string, creator func(projectName string, name string) (modelAPI.Entity, modelAPI.Entity)) {
	// Deletion test
	t.Run(fmt.Sprintf("Deletion test (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myParentResource", "myResource")
			CreateAndWaitUntilEntitiesExist(t, manager, parent, entity)

			expect.DELETE(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path, entity.GetMetadata().GetName())).
				Expect().
				Status(http.StatusNoContent)

			expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path, entity.GetMetadata().GetName())).
				Expect().
				Status(http.StatusNotFound)

			return []modelAPI.Entity{parent}
		})
	})
}

func NotFoundTestScenarioWithProject(t *testing.T, path string, creator func(projectName string, name string) (modelAPI.Entity, modelAPI.Entity)) {
	// "404 - Not found" tests
	t.Run(fmt.Sprintf("\"404 - Not found\" tests (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myParentResource", "not-existing")
			CreateAndWaitUntilEntityExists(t, manager, parent)

			expect.GET(fmt.Sprintf("%s/%s/%s/%s/not-existing", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path)).
				Expect().
				Status(http.StatusNotFound)
			expect.PUT(fmt.Sprintf("%s/%s/%s/%s/not-existing", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusNotFound)
			expect.DELETE(fmt.Sprintf("%s/%s/%s/%s/not-existing", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path)).
				WithJSON(entity).
				Expect().
				Status(http.StatusNotFound)

			return []modelAPI.Entity{parent}
		})
	})
}

func WriteTestScenarioWithProject(t *testing.T, path string, creator func(projectName string, name string) (modelAPI.Entity, modelAPI.Entity)) {
	CreateTestScenarioWithProject(t, path, creator)

	// Update test
	t.Run(fmt.Sprintf("Update test (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myProject", "myResource")
			CreateAndWaitUntilEntitiesExist(t, manager, parent, entity)

			// call now the update endpoint, shouldn't return an error
			o := expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path, entity.GetMetadata().GetName())).
				WithJSON(entity).
				Expect().
				Status(http.StatusOK).
				JSON().Raw()
			// To be able to compare the result, an easy way is to convert the map returned by the test framework.
			// So for that we have to first marshal again the data
			raw, err := json.Marshal(o)
			if err != nil {
				t.Fatal(err)
			}

			result, err := modelV1.GetStruct(modelV1.Kind(entity.GetKind()))
			if err != nil {
				t.Fatal(err)
			}
			if unmarshalErr := json.Unmarshal(raw, result); unmarshalErr != nil {
				t.Fatal(unmarshalErr)
			}

			assert.Equal(t, entity.GetSpec(), result.GetSpec())

			getFunc, _ := CreateGetFunc(t, manager, entity)
			// check the document exists in the db
			_, err = getFunc()
			assert.NoError(t, err)
			return []modelAPI.Entity{parent, entity}
		})
	})

	DeleteTestScenarioWithProject(t, path, creator)
}

func MainTestScenarioWithProject(t *testing.T, path string, creator func(projectName string, name string) (modelAPI.Entity, modelAPI.Entity)) {
	WriteTestScenarioWithProject(t, path, creator)

	// Retrieval tests : Check all different GET methods specifying the parent
	t.Run(fmt.Sprintf("Retrieval tests (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent, entity := creator("myProject", "myResource")
			CreateAndWaitUntilEntitiesExist(t, manager, parent, entity)

			// For the "get all" requests, we have no choice to wait a bit of time between the creation and the "get all"
			time.Sleep(3 * time.Second)

			// Check the retrieval of the entity among all the others
			expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
				Expect().
				Status(http.StatusOK).
				JSON().Array().ContainsAll(entity)

			// Check again if we get the list by project, the entity is still there.
			expect.GET(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path)).
				Expect().
				Status(http.StatusOK).
				JSON().Array().ContainsAll(entity)

			// Check the retrieval of the entity by name
			expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path, entity.GetMetadata().GetName())).
				Expect().
				Status(http.StatusOK).
				JSON().IsEqual(entity)

			return []modelAPI.Entity{parent, entity}
		})
	})

	// Global Retrieval tests : Check GET methods without specifying the parent
	t.Run(fmt.Sprintf("Global Retrieval tests (%s)", path), func(t *testing.T) {
		WithServer(t, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
			parent1, entity1 := creator("myProject1", "myResource1")
			parent2, entity2 := creator("myProject2", "myResource2")
			CreateAndWaitUntilEntitiesExist(t, manager, parent1, parent2, entity1, entity2)

			// For the "get all" requests, we have no choice to wait a bit of time between the creation and the "get all"
			time.Sleep(3 * time.Second)

			expect.GET(fmt.Sprintf("%s/%s", utils.APIV1Prefix, path)).
				Expect().
				Status(http.StatusOK).
				JSON().Array().ContainsAll(entity1, entity2)

			return []modelAPI.Entity{parent1, parent2, entity1, entity2}
		})
	})

	NotFoundTestScenarioWithProject(t, path, creator)
}
