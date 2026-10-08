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

package validate

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/perses/perses/internal/api/plugin"
	testUtils "github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/common"
	"github.com/perses/spec/go/dashboard"
	datasourceSpec "github.com/perses/spec/go/datasource"
	datasourceHTTP "github.com/perses/spec/go/datasource/proxy/http"
	datasourceSQL "github.com/perses/spec/go/datasource/proxy/sql"
	specPlugin "github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testDataFolder = "testdata"

func TestDashboardSpec(t *testing.T) {

	testSuite := []struct {
		title            string
		dashboardFile    string
		expectedErrorStr string
	}{
		{
			title:            "dashboard with variables queries mixing parent variable & regex",
			dashboardFile:    "dashboard_with_regex_in_variable.json",
			expectedErrorStr: "",
		},
	}

	projectPath := testUtils.GetRepositoryPath()

	pl := plugin.New(config.Plugin{
		Path:        filepath.Join(projectPath, config.DefaultPluginPath),
		ArchivePath: filepath.Join(projectPath, config.DefaultArchivePluginPath),
	})
	if err := pl.UnzipArchives(); err != nil {
		t.Fatalf("failed to unzip archives: %s", err)
	}
	if err := pl.Load(); err != nil {
		t.Fatalf("failed to load plugin: %s", err)
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			var persesDashboard modelV1.Dashboard
			testUtils.JSONUnmarshalFromFile(filepath.Join(testDataFolder, test.dashboardFile), &persesDashboard)

			err := DashboardSpec(persesDashboard.Spec, pl.Schema(), &config.HTTPProxyConfig{})

			actualErrorStr := ""
			if err != nil {
				actualErrorStr = err.Error()
			}
			assert.Equal(t, test.expectedErrorStr, actualErrorStr)
		})
	}
}

func TestDatasource(t *testing.T) {

	testSuite := []struct {
		title            string
		datasourceFiles  []string
		expectedErrorStr string
	}{
		{
			title:            "nominal cases",
			datasourceFiles:  []string{"datasource_direct.json", "datasource_proxy.json", "datasource_proxy_2.json"},
			expectedErrorStr: "",
		},
		{
			title:            "error case with wrongly-formatted URL",
			datasourceFiles:  []string{"datasource_direct_2_invalid.json"},
			expectedErrorStr: "invalid value \"www.datasource.com\" (out of bound",
		},
		{
			title:            "error case with a proxy timeout beyond the maximum allowed by the server",
			datasourceFiles:  []string{"datasource_proxy_timeout_too_high.json"},
			expectedErrorStr: `invalid proxy of the datasource "PrometheusWithTooHighTimeout": timeout "5m" exceeds the maximum allowed by the server (1m)`,
		},
	}

	// The config is verified when Perses loads it, which also sets the default values.
	proxyCfg := &config.HTTPProxyConfig{MaxTimeout: common.Duration(time.Minute)}
	if err := proxyCfg.Verify(); err != nil {
		t.Fatalf("failed to verify the proxy config: %s", err)
	}

	projectPath := testUtils.GetRepositoryPath()

	pl := plugin.New(config.Plugin{
		Path:        filepath.Join(projectPath, config.DefaultPluginPath),
		ArchivePath: filepath.Join(projectPath, config.DefaultArchivePluginPath),
	})
	if err := pl.UnzipArchives(); err != nil {
		t.Fatalf("failed to unzip archives: %s", err)
	}
	if err := pl.Load(); err != nil {
		t.Fatalf("failed to load plugin: %s", err)
	}

	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			var datasourcesRaw [][]byte
			for _, file := range test.datasourceFiles {
				datasourcesRaw = append(datasourcesRaw, testUtils.ReadFile(filepath.Join(testDataFolder, file)))
			}

			var datasources []*modelV1.Datasource
			for _, datasourceRaw := range datasourcesRaw {
				var datasource modelV1.Datasource
				testUtils.JSONUnmarshal(datasourceRaw, &datasource)

				datasources = append(datasources, &datasource)
			}

			for _, datasource := range datasources {
				err := Datasource(datasource, datasources, pl.Schema(), proxyCfg)
				if test.expectedErrorStr == "" {
					assert.NoError(t, err)
				} else {
					assert.ErrorContains(t, err, test.expectedErrorStr)
				}
			}
		})
	}
}

func newPrometheusPlugin(proxySpec map[string]any) specPlugin.Plugin {
	return specPlugin.Plugin{
		Kind: "PrometheusDatasource",
		Spec: map[string]any{
			"proxy": map[string]any{
				"kind": "HTTPProxy",
				"spec": proxySpec,
			},
		},
	}
}

func TestValidateHTTPProxyTimeout(t *testing.T) {
	// The config is verified when Perses loads it, which also sets the default values.
	verified := func(cfg config.HTTPProxyConfig) *config.HTTPProxyConfig {
		require.NoError(t, cfg.Verify())
		return &cfg
	}
	serverCfg := verified(config.HTTPProxyConfig{DefaultTimeout: common.Duration(10 * time.Second), MaxTimeout: common.Duration(time.Minute)})
	testSuite := []struct {
		title       string
		proxyConfig any
		proxyCfg    *config.HTTPProxyConfig
		expectedErr string
	}{
		{
			title:       "no timeout: the default one is used",
			proxyConfig: &datasourceHTTP.Config{},
			proxyCfg:    serverCfg,
		},
		{
			title:       "zero timeout: the default one is used",
			proxyConfig: &datasourceHTTP.Config{Timeout: "0s"},
			proxyCfg:    serverCfg,
		},
		{
			title:       "timeout lower than the maximum",
			proxyConfig: &datasourceHTTP.Config{Timeout: "5s"},
			proxyCfg:    serverCfg,
		},
		{
			title:       "timeout higher than the default but not than the maximum",
			proxyConfig: &datasourceHTTP.Config{Timeout: "45s"},
			proxyCfg:    serverCfg,
		},
		{
			title:       "timeout equal to the maximum",
			proxyConfig: &datasourceHTTP.Config{Timeout: "1m"},
			proxyCfg:    serverCfg,
		},
		{
			title:       "timeout higher than the maximum",
			proxyConfig: &datasourceHTTP.Config{Timeout: "1m1s"},
			proxyCfg:    serverCfg,
			expectedErr: `invalid proxy of the datasource "dts": timeout "1m1s" exceeds the maximum allowed by the server (1m)`,
		},
		{
			title:       "the maximum is the default timeout when it is not set",
			proxyConfig: &datasourceHTTP.Config{Timeout: "31s"},
			proxyCfg:    verified(config.HTTPProxyConfig{}),
			expectedErr: `invalid proxy of the datasource "dts": timeout "31s" exceeds the maximum allowed by the server (30s)`,
		},
		{
			title:       "the maximum falls back on the default timeout when the config is not verified",
			proxyConfig: &datasourceHTTP.Config{Timeout: "31s"},
			proxyCfg:    &config.HTTPProxyConfig{},
			expectedErr: `invalid proxy of the datasource "dts": timeout "31s" exceeds the maximum allowed by the server (30s)`,
		},
		{
			title:       "the server config is unknown: the verification is skipped",
			proxyConfig: &datasourceHTTP.Config{Timeout: "1h"},
			proxyCfg:    nil,
		},
		{
			title:       "not an HTTP proxy",
			proxyConfig: &datasourceSQL.Config{},
			proxyCfg:    serverCfg,
		},
		{
			title:       "no proxy",
			proxyConfig: nil,
			proxyCfg:    serverCfg,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := validateHTTPProxyTimeout(test.proxyConfig, "dts", test.proxyCfg)
			if len(test.expectedErr) == 0 {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, test.expectedErr)
			}
		})
	}
}

// TestDashboardSpec_localDatasourceTimeout ensures the timeout of the local datasources is validated as well.
func TestDashboardSpec_localDatasourceTimeout(t *testing.T) {
	spec := dashboard.Spec{
		Datasources: map[string]*datasourceSpec.Spec{
			"prometheus": {
				Plugin: newPrometheusPlugin(map[string]any{"url": "http://localhost:9090", "timeout": "10m"}),
			},
		},
	}
	// The timeout is verified before the schema, so no schema is needed to reach the error.
	err := DashboardSpec(spec, nil, &config.HTTPProxyConfig{})
	assert.EqualError(t, err, `invalid proxy of the datasource "prometheus": timeout "10m" exceeds the maximum allowed by the server (30s)`)
}
