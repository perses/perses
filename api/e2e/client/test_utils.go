// Copyright 2021 The Perses Authors
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

	"github.com/perses/perses/api/dependency"
	e2eframework "github.com/perses/perses/api/e2e/framework"
	"github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/config"
	"github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

func withClient(t *testing.T, testFunc func(v1.ClientInterface, dependency.PersistenceManager) []api.Entity) {
	server, _, persistenceManager := e2eframework.CreateServer(t, e2eframework.DefaultConfig())
	defer server.Close()
	persesClient := createClient(t, server)
	entities := testFunc(persesClient, persistenceManager)
	e2eframework.ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)

}

func createClient(t *testing.T, server *httptest.Server) v1.ClientInterface {
	restClient, err := config.NewRESTClient(config.RestConfigClient{
		URL: common.MustParseURL(server.URL),
	})
	if err != nil {
		t.Fatal(err)
	}
	return v1.NewWithClient(restClient)
}
