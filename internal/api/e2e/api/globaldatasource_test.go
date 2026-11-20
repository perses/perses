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

func TestMainScenarioGlobalDatasource(t *testing.T) {
	e2eframework.MainTestScenario(t, utils.PathGlobalDatasource, func(name string) api.Entity {
		return e2eframework.NewGlobalDatasource(t, name)
	})
}

func TestGlobalDatasourceWithoutProxySpec(t *testing.T) {
	testCases := []struct {
		name  string
		proxy string
	}{
		{
			name:  "null spec",
			proxy: `{"kind":"HTTPProxy","spec":null}`,
		},
		{
			name:  "missing spec",
			proxy: `{"kind":"HTTPProxy"}`,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			e2eframework.WithServerAuthConfig(t, func(_ *httptest.Server, expect *httpexpect.Expect, _ dependency.Manager, token string) []api.Entity {
				body := []byte(fmt.Sprintf(`{"kind":"GlobalDatasource","metadata":{"name":"prom"},"spec":{"default":false,"plugin":{"kind":"PrometheusDatasource","spec":{"proxy":%s}}}}`, tc.proxy))
				expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathGlobalDatasource)).
					WithHeader(e2eframework.CreateAuthorizationHeader(token)).
					WithHeader("Content-Type", "application/json").
					WithBytes(body).
					Expect().
					Status(http.StatusBadRequest)
				expect.POST(fmt.Sprintf("%s/validate/%s", utils.APIPrefix, utils.PathGlobalDatasource)).
					WithHeader(e2eframework.CreateAuthorizationHeader(token)).
					WithHeader("Content-Type", "application/json").
					WithBytes(body).
					Expect().
					Status(http.StatusBadRequest)
				return []api.Entity{}
			})
		})
	}
}
