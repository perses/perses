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

package auth

import (
	"net/http"
	"net/url"
	"testing"

	"github.com/perses/perses/internal/api/shared/utils"
	"github.com/stretchr/testify/assert"
)

func TestGetRedirectURI(t *testing.T) {
	assert.Equal(t, "http://localhost:8080/api/auth/providers/oidc/azure/callback", getRedirectURI(&http.Request{
		URL: &url.URL{
			Scheme: "http",
		},
		Host: "localhost:8080",
	}, utils.AuthKindOIDC, "azure"))
}
