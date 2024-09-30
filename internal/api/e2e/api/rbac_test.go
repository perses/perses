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
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/stretchr/testify/assert"
)

func TestNewProjectEndpoints(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		creator := "foo"
		usrEntity := e2eframework.NewUser(creator)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}
		authResponse := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsAll("access_token", "refresh_token")
		token := authResponse.JSON().Object().Value("access_token").String().Raw()

		projectName := "mysuperproject"
		projectEntity := e2eframework.NewProject(projectName)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathProject)).WithJSON(projectEntity).WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).Expect().Status(http.StatusOK)

		variableEntity := e2eframework.NewVariable(projectName, "mysupervariable")
		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIV1Prefix, utils.PathProject, projectName, utils.PathVariable)).WithJSON(variableEntity).WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).Expect().Status(http.StatusOK)

		expect.DELETE(fmt.Sprintf("%s/%s/%s", utils.APIV1Prefix, utils.PathProject, projectName)).WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).
			Expect().
			Status(http.StatusNoContent)

		_, err := manager.GetVariable().Get(projectName, variableEntity.Metadata.Name)
		assert.True(t, databaseModel.IsKeyNotFound(err))
		_, err = manager.GetProject().Get(projectName)
		assert.True(t, databaseModel.IsKeyNotFound(err))
		e2eframework.ClearAllKeys(t, manager.GetPersesDAO(), usrEntity)
		return []modelAPI.Entity{}
	})
}

func TestAnonymousEndpoints(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		creator := "foo"
		usrEntity := e2eframework.NewUser(creator)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}
		authResponse := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsOnly("access_token", "refresh_token")
		token := authResponse.JSON().Object().Value("access_token").String().Raw()

		expect.GET("/api/config").WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).Expect().Status(http.StatusOK)
		expect.GET("/api/config").WithHeader("Authorization", "Bearer <bad token>").Expect().Status(http.StatusOK)
		expect.GET("/api/config").Expect().Status(http.StatusOK)

		e2eframework.ClearAllKeys(t, manager.GetPersesDAO(), usrEntity)
		return []modelAPI.Entity{}
	})
}

func TestUnauthorizedEndpoints(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		creator := "foo"
		usrEntity := e2eframework.NewUser(creator)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}
		authResponse := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsOnly("access_token", "refresh_token")
		token := authResponse.JSON().Object().Value("access_token").String().Raw()

		glRole := e2eframework.NewGlobalRole("test")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathGlobalRole)).WithJSON(glRole).WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).Expect().Status(http.StatusForbidden)

		// This test only work if the auth cookies are not present from a request to another one.
		// During the execution of the e2e tests, cookies are persisted from a request to another one.
		// The only way to avoid keeping the auth cookie is to set the cookie param 'secure' at true.
		// As the connection is not secured, the cookies cannot be kept (secure means it works only with https).
		// This is what is done in e2eframework.DefaultAuthConfig
		project2Entity := e2eframework.NewProject("mysuperproject2")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathProject)).WithJSON(project2Entity).WithHeader("Authorization", "Bearer <bad token>").Expect().Status(http.StatusUnauthorized)

		e2eframework.ClearAllKeys(t, manager.GetPersesDAO(), usrEntity)
		return []modelAPI.Entity{}
	})
}
