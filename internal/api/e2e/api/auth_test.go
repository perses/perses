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
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/api/shared/utils"
	modelAPI "github.com/perses/perses/pkg/model/api"
)

func TestAuth(t *testing.T) {
	e2eframework.WithServerConfig(t, serverAuthConfig(), func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usrEntity := e2eframework.NewUser("foo")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}

		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK)
		return []modelAPI.Entity{usrEntity}
	})
}

func TestAuth_EmptyPassword(t *testing.T) {
	e2eframework.WithServerConfig(t, serverAuthConfig(), func(expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usrEntity := e2eframework.NewUser("foo")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: "",
		}

		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusBadRequest)
		return []modelAPI.Entity{usrEntity}
	})
}
