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

package httpsd

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	clientConfig "github.com/perses/perses/pkg/client/config"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExecute_ReturnErrorWhenRequestFails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()
	client, err := clientConfig.NewRESTClient(clientConfig.RestConfigClient{URL: common.MustParseURL(server.URL)})
	require.NoError(t, err)

	d := &discovery{restClient: client, name: "http"}
	assert.ErrorContains(t, d.Execute(context.Background(), func() {}), `failed to execute http discovery "http"`)
}
