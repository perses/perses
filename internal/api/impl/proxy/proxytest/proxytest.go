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

// Package proxytest provides utilities shared by the tests of the datasource proxies.
// It must only be imported by tests.
package proxytest

import (
	"errors"
	"testing"

	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/pkg/model/api/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// NewLoopbackGuard returns a guard allowing the loopback interface, as the test servers are listening on it.
func NewLoopbackGuard(t testing.TB) *netguard.Guard {
	t.Helper()
	cfg := config.DatasourceProxyConfig{AllowedNetworks: []string{"127.0.0.0/8", "::1/128"}}
	require.NoError(t, cfg.Verify())
	return netguard.New(cfg)
}

// NewDefaultGuard returns a guard applying the default policy (e.g. the loopback interface is denied).
func NewDefaultGuard(t testing.TB) *netguard.Guard {
	t.Helper()
	cfg := config.DatasourceProxyConfig{}
	require.NoError(t, cfg.Verify())
	return netguard.New(cfg)
}

// RequireHTTPError verifies the HTTP status code the error is translated to by the error middleware.
func RequireHTTPError(t testing.TB, err error, code int) {
	t.Helper()
	require.Error(t, err)
	var httpErr *echo.HTTPError
	require.True(t, errors.As(apiinterface.HandleError(err), &httpErr), "expected an error translated to an echo.HTTPError, got %T: %v", err, err)
	assert.Equal(t, code, httpErr.Code)
}
