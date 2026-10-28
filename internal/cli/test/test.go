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

package test

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"regexp"
	"testing"

	"github.com/mholt/archives"
	"github.com/perses/perses/internal/api/archive"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/pkg/client/api"
	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type Suite struct {
	Title                string
	Args                 []string
	APIClient            api.ClientInterface
	Config               config.Config
	ExpectedMessage      string
	ExpectedRegexMessage string
	IsErrorExpected      bool
}

func ExecuteSuiteTest(t *testing.T, newCMD func() *cobra.Command, suites []Suite) {
	configFilePath := "./config.json"
	for _, test := range suites {
		t.Run(test.Title, func(t *testing.T) {
			buffer := bytes.NewBufferString("")
			cmd := newCMD()
			cmd.SetOut(buffer)
			cmd.SetErr(buffer)
			cmd.SetArgs(test.Args)

			config.Global = &(test.Config)
			config.Global.SetAPIClient(test.APIClient)
			config.Global.SetFilePath(configFilePath)
			if len(config.Global.Dac.OutputFolder) == 0 {
				config.Global.Dac.OutputFolder = config.DefaultOutputFolder
			}

			err := cmd.Execute()
			if test.IsErrorExpected {
				if assert.NotNil(t, err) {
					if len(test.ExpectedRegexMessage) > 0 {
						matched, _ := regexp.MatchString(test.ExpectedRegexMessage, err.Error())
						assert.True(t, matched, "Expected error message to match regex: %s\nActual error: %s", test.ExpectedRegexMessage, err.Error())
					} else {
						assert.Equal(t, test.ExpectedMessage, err.Error())
					}
				}
			} else if assert.Nil(t, err) {
				if len(test.ExpectedRegexMessage) > 0 {
					matched, _ := regexp.MatchString(test.ExpectedRegexMessage, buffer.String())
					assert.True(t, matched, "Expected output to match regex: %s\nActual output: %s", test.ExpectedRegexMessage, buffer.String())
				} else {
					assert.Equal(t, test.ExpectedMessage, buffer.String())
				}
			}
			_ = os.Remove(configFilePath)
		})
	}
}

// ArchivePlugins creates a tar.gz archive for each plugin folder found in pluginFolder.
// The archives are stored in a temporary folder that is returned, so it can be used as a plugin path containing only archives.
func ArchivePlugins(t *testing.T, pluginFolder string) string {
	archiveFolder := t.TempDir()
	plugins, err := os.ReadDir(pluginFolder)
	require.NoError(t, err)
	for _, plugin := range plugins {
		if !plugin.IsDir() {
			continue
		}
		pluginFiles, readErr := os.ReadDir(filepath.Join(pluginFolder, plugin.Name()))
		require.NoError(t, readErr)
		// The plugin files are stored at the root of the archive.
		list := make(map[string]string)
		for _, f := range pluginFiles {
			list[filepath.Join(pluginFolder, plugin.Name(), f.Name())] = f.Name()
		}
		files, filesErr := archives.FilesFromDisk(context.Background(), nil, list)
		require.NoError(t, filesErr)
		require.NoError(t, archive.Build(filepath.Join(archiveFolder, plugin.Name()), archive.TARgz, files))
	}
	return archiveFolder
}
