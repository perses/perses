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

package plugin

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
)

func TestLoadDevPluginReportsPackageError(t *testing.T) {
	// The manifest is reachable and valid, but reading the package fails. This
	// reproduces the case where LoadDevPlugin must surface the real package error.
	const invalidPackageBody = "this is not valid JSON"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, ManifestFileName):
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"id":"foo","name":"foo","metaData":{"buildInfo":{"buildVersion":"0.1.0"}}}`))
		case strings.HasSuffix(r.URL.Path, PackageJSONFile):
			_, _ = w.Write([]byte(invalidPackageBody))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	p := &pluginFile{}
	err := p.LoadDevPlugin([]v1.PluginInDevelopment{
		{
			Name:          "foo",
			URL:           common.MustParseURL(server.URL),
			DisableSchema: true,
			AbsolutePath:  "/tmp/foo",
		},
	})

	assert.Error(t, err)
	// The message must carry the actual cause of the package read failure, not the
	// nil manifest error that used to be interpolated here (regression guard).
	assert.Contains(t, err.Error(), "failed to load plugin package")
	assert.NotContains(t, err.Error(), "%!s(<nil>)")
}
