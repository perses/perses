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

package core

import (
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/internal/test"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/stretchr/testify/assert"
)

// We cannot reuse in this package what is inside internal/api/e2e because it would create a
// circular dependency. There is hence some test code duplication between both packages.
func defaultConfig() apiConfig.Config {
	projectPath := test.GetRepositoryPath()
	return apiConfig.Config{
		Security: apiConfig.Security{
			Readonly:      false,
			EnableAuth:    false,
			EncryptionKey: secret.Hidden(hex.EncodeToString([]byte("=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"))),
		},
		Plugin: apiConfig.Plugin{
			Path:        filepath.Join(projectPath, "plugins"),
			ArchivePath: filepath.Join(projectPath, "plugins-archive"),
		},
		Database: apiConfig.Database{
			File: &apiConfig.File{
				Folder:        "./test",
				Extension:     apiConfig.JSONExtension,
				CaseSensitive: true,
			},
		},
	}
}

func withServer(t *testing.T, config apiConfig.Config, testFunc func(*httpexpect.Expect)) {
	runner, persistenceManager, err := New(config, false, prometheus.NewRegistry(), "")
	assert.NoError(t, err)

	handler, err := runner.HTTPServerBuilder().BuildHandler()
	assert.NoError(t, err)

	server := httptest.NewServer(handler)

	defer persistenceManager.GetPersesDAO().Close()
	defer server.Close()

	expect := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	testFunc(expect)
}

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

func TestCORSDefaultConfig(t *testing.T) {
	config := defaultConfig()
	config.Security.CORS = apiConfig.CORSConfig{
		Enable: true,
	}
	withServer(t, config, func(expect *httpexpect.Expect) {
		resp := sendPreflightRequest(expect, "https://github.com")
		resp.Status(http.StatusNoContent)
		resp.Header("Access-Control-Allow-Origin").IsEqual("*")
		resp.Header("Access-Control-Allow-Methods").IsEqual("OPTIONS, GET, POST")

		resp = sendRequest(expect, "https://github.com")
		resp.Status(http.StatusOK)
		resp.Header("Access-Control-Allow-Origin").IsEqual("*")
	})
}

func TestCORSCustomConfig(t *testing.T) {
	config := defaultConfig()
	config.Security.CORS = apiConfig.CORSConfig{
		Enable:       true,
		AllowOrigins: []string{"https://gitlab.com", "https://github.com"},
		AllowMethods: []string{"OPTIONS", "GET"},
	}
	withServer(t, config, func(expect *httpexpect.Expect) {
		// Test with a valid origin.
		resp := sendPreflightRequest(expect, "https://github.com")
		resp.Status(http.StatusNoContent)
		resp.Header("Access-Control-Allow-Origin").IsEqual("https://github.com")
		resp.Header("Access-Control-Allow-Methods").IsEqual("OPTIONS,GET")

		resp = sendRequest(expect, "https://github.com")
		resp.Status(http.StatusOK)
		resp.Header("Access-Control-Allow-Origin").IsEqual("https://github.com")

		// Test with an invalid origin.
		resp = sendPreflightRequest(expect, "https://google.com")
		resp.Status(http.StatusNoContent)
		resp.Header("Access-Control-Allow-Origin").IsEmpty()
		resp.Header("Access-Control-Allow-Methods").IsEmpty()

		resp = sendRequest(expect, "https://google.com")
		resp.Status(http.StatusOK)
		resp.Header("Access-Control-Allow-Origin").IsEmpty()
	})
}
