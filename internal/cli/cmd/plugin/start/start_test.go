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
	"bytes"
	"path/filepath"
	"testing"
	"time"

	"github.com/perses/perses/internal/test"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
		expectedPluginInDevelopment *v1.PluginInDevelopment
	}{
		{
			name:       "single plugin",
			pluginPath: filepath.Join("..", "build", "testdata", "barchart"),
			expectedPluginInDevelopment: &v1.PluginInDevelopment{
				Name:         "BarChart",
				Version:      "0.4.1",
				URL:          common.MustParseURL("http://localhost:3005"),
				AbsolutePath: filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "build", "testdata", "barchart"),
			},
		},
		{
			name:       "tempo plugin",
			pluginPath: filepath.Join("..", "build", "testdata", "tempo"),
			expectedPluginInDevelopment: &v1.PluginInDevelopment{
				Name:         "Tempo",
				Version:      "0.2.0",
				URL:          common.MustParseURL("http://localhost:3005"),
				AbsolutePath: filepath.Join(projectPath, "internal", "cli", "cmd", "plugin", "build", "testdata", "tempo"),
			},
		},
	}
	for _, tt := range testSuite {
		o := &option{}
		t.Run(tt.name, func(t *testing.T) {
			devServer, pluginInDevelopment, err := o.preparePlugin(tt.pluginPath, nil)
			assert.NoError(t, err)
			assert.NotNil(t, devServer)
			assert.Equal(t, tt.expectedPluginInDevelopment, pluginInDevelopment)
		})
	}
}

func TestPortCapturingWriter(t *testing.T) {
	testSuite := []struct {
		name         string
		output       string
		expectedPort int
		shouldDetect bool
	}{
		{
			name: "rsbuild local output",
			output: `
  Rsbuild v1.4.15

  ➜  Local:    http://localhost:3001
  ➜  Network:  http://192.168.178.173:3001
`,
			expectedPort: 3001,
			shouldDetect: true,
		},
		{
			name: "rsbuild with 127.0.0.1",
			output: `
  Rsbuild v1.4.15

  ➜  Local:    http://127.0.0.1:3005
  ➜  Network:  http://192.168.178.173:3005
`,
			expectedPort: 3005,
			shouldDetect: true,
		},
		{
			name: "rsbuild with tabs",
			output: `
  Rsbuild v1.4.15

  ➜  Local:	http://localhost:8080
  ➜  Network:	http://192.168.178.173:8080
`,
			expectedPort: 8080,
			shouldDetect: true,
		},
		{
			name: "output without port",
			output: `
  Rsbuild v1.4.15
  Starting development server...
`,
			expectedPort: 0,
			shouldDetect: false,
		},
		{
			name: "output with network only",
			output: `
  ➜  Network:  http://192.168.178.173:3001
`,
			expectedPort: 0,
			shouldDetect: false,
		},
		{
			name:         "output with network only",
			output:       `[PERSES_PLUGIN] PORT="3009"`,
			expectedPort: 3009,
			shouldDetect: true,
		},
		{
			name:         "output with network only",
			output:       `[PERSES_PLUGIN]`,
			expectedPort: 0,
			shouldDetect: false,
		},
	}

	for _, tt := range testSuite {
		t.Run(tt.name, func(t *testing.T) {
			portChan := make(chan int, 1)
			var buf bytes.Buffer
			writer := newPortCapturingWriter(&buf, portChan)

			// Write the output
			n, err := writer.Write([]byte(tt.output))
			require.NoError(t, err)
			assert.Equal(t, len(tt.output), n)
			assert.Equal(t, tt.output, buf.String())

			// Check if port was detected
			if tt.shouldDetect {
				select {
				case port := <-portChan:
					assert.Equal(t, tt.expectedPort, port)
				case <-time.After(100 * time.Millisecond):
					t.Fatal("expected port to be detected but timeout occurred")
				}
			} else {
				select {
				case port := <-portChan:
					t.Fatalf("expected no port detection but got port %d", port)
				case <-time.After(100 * time.Millisecond):
					// Success - no port detected
				}
			}
		})
	}
}

func TestPortCapturingWriterOnlyDetectsOnce(t *testing.T) {
	portChan := make(chan int, 2) // Buffer for 2 to see if it sends twice
	var buf bytes.Buffer
	writer := newPortCapturingWriter(&buf, portChan)

	// Write multiple outputs with ports
	output1 := "  ➜  Local:    http://localhost:3001\n"
	output2 := "  ➜  Local:    http://localhost:3002\n"

	_, err := writer.Write([]byte(output1))
	require.NoError(t, err)

	_, err = writer.Write([]byte(output2))
	require.NoError(t, err)

	// Should only get the first port
	select {
	case port := <-portChan:
		assert.Equal(t, 3001, port)
	case <-time.After(100 * time.Millisecond):
		t.Fatal("expected port to be detected")
	}

	// Should not get a second port
	select {
	case port := <-portChan:
		t.Fatalf("expected only one port detection but got second port %d", port)
	case <-time.After(100 * time.Millisecond):
		// Success - only one port detected
	}
}
