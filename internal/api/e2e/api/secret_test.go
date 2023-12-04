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
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/gavv/httpexpect/v2"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/api/shared/utils"
	"github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func decodePublicSecret(t *testing.T, object interface{}) *modelV1.PublicSecret {
	// To be able to compare the result, an easy way is to convert the map returned by the test framework.
	// So for that we have to first marshal again the data
	raw, err := json.Marshal(object)
	if err != nil {
		t.Fatal(err)
	}

	result := &modelV1.PublicSecret{}
	if unmarshalErr := json.Unmarshal(raw, result); unmarshalErr != nil {
		t.Fatal(unmarshalErr)
	}
	return result
}

func TestMainScenarioSecret(t *testing.T) {
	path := utils.PathSecret
	creator := func(projectName string, name string) (api.Entity, api.Entity) {
		return e2eframework.NewProject(projectName), e2eframework.NewSecret(projectName, name)
	}
	e2eframework.CreateTestScenarioWithProject(t, path, creator)

	t.Run(fmt.Sprintf("Update test (%s)", path), func(t *testing.T) {
		e2eframework.WithServer(t, func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []api.Entity {
			parent, entity := creator("myProject", "myResource")
			e2eframework.CreateAndWaitUntilEntitiesExist(t, manager, parent, entity)

			// call now the update endpoint, shouldn't return an error
			o := expect.PUT(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, parent.GetMetadata().GetName(), path, entity.GetMetadata().GetName())).
				WithJSON(entity).
				Expect().
				Status(http.StatusOK).
				JSON().Raw()

			result := decodePublicSecret(t, o)
			assert.Equal(t, e2eframework.NewPublicSecret(parent.GetMetadata().GetName(), entity.GetMetadata().GetName()).GetSpec(), result.GetSpec())

			getFunc, _ := e2eframework.CreateGetFunc(t, manager, entity)
			// check the document exists in the db
			_, err := getFunc()
			assert.NoError(t, err)
			return []api.Entity{parent, entity}
		})
	})

	e2eframework.DeleteTestScenarioWithProject(t, path, creator)
	e2eframework.NotFoundTestScenarioWithProject(t, path, creator)
}
