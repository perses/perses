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

package main

import (
	_ "embed"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/perses/common/async"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

//go:embed plugin.yaml
var pluginListData []byte

const (
	githubURL           = "https://github.com/perses/perses-plugins/releases/download"
	pluginArchiveFolder = "plugins-archive"
)

type plugin struct {
	PluginName string `yaml:"name"`
	Version    string `yaml:"version"`
}

func downloadPlugin(plugin plugin) {
	pluginName := fmt.Sprintf("%s-%s", plugin.PluginName, plugin.Version)
	resp, err := http.Get(fmt.Sprintf("%s/%s/%s.tar.gz", githubURL, pluginName, pluginName))
	if err != nil {
		logrus.WithError(err).Errorf("unable to download plugin %s", pluginName)
		return
	}
	if resp.StatusCode == http.StatusNotFound {
		// First, let's close the previous body.
		resp.Body.Close()
		// Then try to download the plugin with the new tag name.
		resp, err = http.Get(fmt.Sprintf("%s/%s/v%s/%s.tar.gz", githubURL, strings.ToLower(plugin.PluginName), plugin.Version, pluginName))
		if err != nil {
			logrus.WithError(err).Errorf("unable to download plugin %s", pluginName)
			return
		}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		logrus.Errorf("unable to download plugin %s, status code %d", pluginName, resp.StatusCode)
		return
	}

	out, err := os.Create(filepath.Join(pluginArchiveFolder, fmt.Sprintf("%s.tar.gz", pluginName)))
	if err != nil {
		logrus.WithError(err).Errorf("unable to create file for plugin %s", pluginName)
		return
	}
	defer out.Close()

	if _, copyErr := io.Copy(out, resp.Body); copyErr != nil {
		logrus.WithError(copyErr).Errorf("unable to copy plugin %s", pluginName)
	}
}

func main() {
	var plugins []plugin
	if err := yaml.Unmarshal(pluginListData, &plugins); err != nil {
		panic(err)
	}
	// create the plugin archive folder
	if err := os.MkdirAll(pluginArchiveFolder, os.ModePerm); err != nil {
		panic(err)
	}

	var downloadToBeDone []async.Future[string]
	for _, pl := range plugins {
		if _, err := os.Stat(filepath.Join(pluginArchiveFolder, fmt.Sprintf("%s-%s.tar.gz", pl.PluginName, pl.Version))); err == nil {
			fmt.Printf("Plugin %s already downloaded\n", pl.PluginName)
			continue
		}
		downloadToBeDone = append(downloadToBeDone, async.Async(func() (string, error) {
			fmt.Printf("Downloading plugin %s\n", pl.PluginName)
			downloadPlugin(pl)
			return "", nil
		}))
	}
	for _, download := range downloadToBeDone {
		_, _ = download.Await()
	}
}
