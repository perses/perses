// Copyright 2025 The Perses Authors
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
	modelAPI "github.com/perses/perses/pkg/model/api"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
)

func sendPreflightRequest(expect *httpexpect.Expect, origin string) *httpexpect.Response {
	return expect.OPTIONS(fmt.Sprintf("%s/projects", utils.APIV1Prefix)).
		WithHeader("Origin", origin).
		Expect()
}

func sendRequest(expect *httpexpect.Expect, origin string) *httpexpect.Response {
	return expect.GET(fmt.Sprintf("%s/projects", utils.APIV1Prefix)).
		WithHeader("Origin", origin).
		Expect()
}

func TestDefaultConfig(t *testing.T) {
	config := e2eframework.DefaultConfig()
	config.Security.CORS = apiConfig.CORSConfig{
		Enable: true,
	}
	e2eframework.WithServerConfig(t, config, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		resp := sendPreflightRequest(expect, "https://github.com")
		resp.Status(http.StatusNoContent)
		resp.Header("Access-Control-Allow-Origin").IsEqual("*")
		resp.Header("Access-Control-Allow-Methods").IsEqual("OPTIONS, GET, POST")

		resp = sendRequest(expect, "https://github.com")
		resp.Status(http.StatusOK)
		resp.Header("Access-Control-Allow-Origin").IsEqual("*")

		// no entities were created
		return []modelAPI.Entity{}
	})
}

func TestCustomConfig(t *testing.T) {
	config := e2eframework.DefaultConfig()
	config.Security.CORS = apiConfig.CORSConfig{
		Enable:       true,
		AllowOrigins: []string{"https://gitlab.com", "https://github.com"},
		AllowMethods: []string{"OPTIONS", "GET"},
		MaxAge:       86400,
	}
	e2eframework.WithServerConfig(t, config, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		// test allowed CORS request
		resp := sendPreflightRequest(expect, "https://github.com")
		resp.Status(http.StatusNoContent)
		resp.Header("Access-Control-Allow-Origin").IsEqual("https://github.com")
		resp.Header("Access-Control-Allow-Methods").IsEqual("OPTIONS,GET")
		resp.Header("Access-Control-Max-Age").IsEqual("86400")

		resp = sendRequest(expect, "https://github.com")
		resp.Status(http.StatusOK)
		resp.Header("Access-Control-Allow-Origin").IsEqual("https://github.com")

		// test disallowed CORS request
		resp = sendPreflightRequest(expect, "https://google.com")
		resp.Status(http.StatusNoContent)
		resp.Header("Access-Control-Allow-Origin").IsEmpty()
		resp.Header("Access-Control-Allow-Methods").IsEmpty()

		resp = sendRequest(expect, "https://google.com")
		resp.Status(http.StatusOK)
		resp.Header("Access-Control-Allow-Origin").IsEmpty()

		// no entities were created
		return []modelAPI.Entity{}
	})
}
