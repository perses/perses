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
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/config"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/api/shared/utils"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/assert"
)

func serverAuthConfig() config.Config {
	conf := e2eframework.DefaultConfig()
	conf.Security.EnableAuth = true
	conf.Security.Authorization = config.AuthorizationConfig{GuestPermissions: []*role.Permission{
		{
			Actions: []role.Action{role.ReadAction},
			Scopes:  []role.Scope{role.WildcardScope},
		},
		{
			Actions: []role.Action{role.CreateAction},
			Scopes:  []role.Scope{role.ProjectScope},
		},
	}}
	return conf
}

func TestNewProjectEndpoints(t *testing.T) {
	e2eframework.WithServerConfig(t, serverAuthConfig(), func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		creator := "foo"
		usrEntity := e2eframework.NewUser(creator)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.Password,
		}
		authResponse := expect.POST("/api/auth").
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsAll("accessToken", "refreshToken")
		token := authResponse.JSON().Object().Value("accessToken").String().Raw()

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
	e2eframework.WithServerConfig(t, serverAuthConfig(), func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		creator := "foo"
		usrEntity := e2eframework.NewUser(creator)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.Password,
		}
		authResponse := expect.POST("/api/auth").
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsOnly("accessToken", "refreshToken")
		token := authResponse.JSON().Object().Value("accessToken").String().Raw()

		expect.GET("/api/config").WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).Expect().Status(http.StatusOK)
		expect.GET("/api/config").WithHeader("Authorization", "Bearer <bad token>").Expect().Status(http.StatusOK)
		expect.GET("/api/config").Expect().Status(http.StatusOK)

		e2eframework.ClearAllKeys(t, manager.GetPersesDAO(), usrEntity)
		return []modelAPI.Entity{}
	})
}

func TestUnauthorizedEndpoints(t *testing.T) {
	e2eframework.WithServerConfig(t, serverAuthConfig(), func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		creator := "foo"
		usrEntity := e2eframework.NewUser(creator)
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.Password,
		}
		authResponse := expect.POST("/api/auth").
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)

		authResponse.JSON().Object().Keys().ContainsOnly("accessToken", "refreshToken")
		token := authResponse.JSON().Object().Value("accessToken").String().Raw()

		glRole := e2eframework.NewGlobalRole("test")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathGlobalRole)).WithJSON(glRole).WithHeader("Authorization", fmt.Sprintf("Bearer %s", token)).Expect().Status(http.StatusUnauthorized)

		project2Entity := e2eframework.NewProject("mysuperproject2")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathProject)).WithJSON(project2Entity).WithHeader("Authorization", "Bearer <bad token>").Expect().Status(http.StatusUnauthorized)

		e2eframework.ClearAllKeys(t, manager.GetPersesDAO(), usrEntity)
		return []modelAPI.Entity{}
	})
}
