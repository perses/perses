// Copyright 2024 The Perses Authors
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

package client

import (
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/config"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
)

// This test is mainly here to test that when auth is configured in the perseshttp.client, then it will automatically handle the auth and refresh the token as well.
func TestGetProtectedDatasource(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		projectEntity := e2eframework.NewProject("perses")
		entity := e2eframework.NewDatasource(t, "perses", "myDTS")
		usrEntity := e2eframework.NewUser("foo", "$2a$10$iCemKjvjN.ieqJOPlEL5keGRLAGKRGBNjph2N8uY.4XFPZYwcBT8K") // the encrypted value for password
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, usrEntity)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, projectEntity)
		e2eframework.CreateAndWaitUntilEntityExists(t, manager, entity)
		restClient, err := config.NewRESTClient(config.RestConfigClient{
			URL: common.MustParseURL(server.URL),
			Auth: &config.Auth{NativeAuth: &modelAPI.Auth{
				Login:    "foo",
				Password: "password",
			}},
		})
		assert.NoError(t, err)
		object, err := v1.NewWithClient(restClient).Datasource(entity.Metadata.Project).Get(entity.Metadata.Name)
		assert.NoError(t, err)
		assert.Equal(t, entity.Metadata.Name, object.Metadata.Name)
		assert.Equal(t, entity.Spec, object.Spec)
		return []modelAPI.Entity{projectEntity, entity, usrEntity}
	})
}
