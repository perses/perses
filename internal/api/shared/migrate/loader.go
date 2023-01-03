// Copyright 2023 The Perses Authors
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

package migrate

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"cuelang.org/go/cue"
	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/sirupsen/logrus"
)

func NewHotReloaders(service Migration) (async.SimpleTask, async.SimpleTask, error) {
	fsWatcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, nil, err
	}

	callback := func() {
		service.BuildMigrationSchemaString()
	}
	loaders := service.GetLoaders()

	return &schemas.Watcher{
			FSWatcher:      fsWatcher,
			Loaders:        loaders,
			LoaderCallback: callback,
		}, &schemas.Reloader{
			Loaders:        loaders,
			LoaderCallback: callback,
		},
		nil
}

type loader interface {
	schemas.Loader
	getConditions() string
	getPlaceholder() string
}

type migCuePart struct {
	loader
	context          *cue.Context
	listOfConditions string
	schemasPath      string
	defaultValue     string
	placeholderText  string
	mutex            sync.RWMutex
}

func (c *migCuePart) GetSchemaPath() string {
	return c.schemasPath
}

func (c *migCuePart) Load() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	conditions, err := c.buildListOfConditions()
	if err != nil {
		return err
	}
	c.listOfConditions = conditions
	return nil
}

func (c *migCuePart) getConditions() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return c.listOfConditions
}

func (c *migCuePart) getPlaceholder() string {
	return c.placeholderText
}

func (c *migCuePart) buildListOfConditions() (string, error) {
	files, err := os.ReadDir(c.schemasPath)
	if err != nil {
		return "", err
	}

	var listOfConditions strings.Builder

	// process each schema plugin to convert it into a CUE Value
	for _, file := range files {
		if !file.IsDir() {
			// TODO probably we want to walk into all nested directory. To be sure we are grabbing every .cuepart files
			logrus.Tracef("file %s is ignored since we are looking for directories", file.Name())
			continue
		}
		migFilePath := filepath.Join(c.schemasPath, file.Name(), "mig.cuepart")
		contentStr, readErr := os.ReadFile(migFilePath)
		if readErr != nil {
			logrus.WithError(readErr).Debugf("No migration file found at %s, plugin %s will be skipped", migFilePath, file.Name())
			continue
		}

		listOfConditions.WriteString(string(contentStr))
		listOfConditions.WriteString("\n")
	}

	// append a default conditional for any Grafana plugin that has no corresponding Perses plugin
	listOfConditions.WriteString(fmt.Sprintf(`
	{
		%s
	}`, c.defaultValue))
	listOfConditions.WriteString("\n")

	return listOfConditions.String(), nil
}
