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

package start

import (
	"path/filepath"
	"testing"

	"github.com/perses/perses/internal/test"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
)

func TestGetServerPortAndExactPluginName(t *testing.T) {
	testSuite := []struct {
		name         string
		pluginPath   string
		expectedPort int
		expectedName string
	}{
		{
			name:         "single plugin",
			pluginPath:   filepath.Join("..", "build", "testdata", "barchart"),
			expectedPort: 3005,
			expectedName: "BarChart",
		},
		{
			name:         "tempo plugin",
			pluginPath:   filepath.Join("..", "build", "testdata", "tempo"),
			expectedPort: 3005,
			expectedName: "Tempo",
		},
	}
	for _, tt := range testSuite {
		t.Run(tt.name, func(t *testing.T) {
			port, name, err := getServerPortAndExactPluginName(tt.pluginPath)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedPort, port)
			assert.Equal(t, tt.expectedName, name)
		})
	}
}

func TestPreparePlugin(t *testing.T) {
	projectPath := test.GetRepositoryPath()
	testSuite := []struct {
		name                        string
		pluginPath                  string
		expectedDevServer           *devserver
		expectedPluginInDevelopment *apiConfig.PluginInDevelopment
	}{
		{
			name:       "single plugin",
			pluginPath: filepath.Join("..", "build", "testdata", "barchart"),
			expectedDevServer: &devserver{
				pluginPath:        filepath.Join("..", "build", "testdata", "barchart"),
				rsbuildScriptName: "dev",
			},
			expectedPluginInDevelopment: &apiConfig.PluginInDevelopment{
				Name:         "BarChart",
				URL:          common.MustParseURL("http://localhost:3005"),
				AbsolutePath: filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "build", "testdata", "barchart"),
			},
		},
		{
			name:       "tempo plugin",
			pluginPath: filepath.Join("..", "build", "testdata", "tempo"),
			expectedDevServer: &devserver{
				pluginPath:        filepath.Join("..", "build", "testdata", "tempo"),
				rsbuildScriptName: "dev",
			},
			expectedPluginInDevelopment: &apiConfig.PluginInDevelopment{
				Name:         "Tempo",
				URL:          common.MustParseURL("http://localhost:3005"),
				AbsolutePath: filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "build", "testdata", "tempo"),
			},
		},
	}
	for _, tt := range testSuite {
		o := &option{}
		t.Run(tt.name, func(t *testing.T) {
			devServer, pluginInDevelopment, err := o.preparePlugin(tt.pluginPath)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedDevServer, devServer)
			assert.Equal(t, tt.expectedPluginInDevelopment, pluginInDevelopment)
		})
	}
}
