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
	"sync/atomic"

	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/schemas"
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
	listOfConditions atomic.Pointer[string]
	schemasPath      string
	defaultValue     string
	placeholderText  string
}

func (c *migCuePart) GetSchemaPath() string {
	return c.schemasPath
}

// Load will load the migration schemas from the filesystem
func (c *migCuePart) Load() (int, int, error) {
	var conditions string
	conditions, successfulLoadsCount, err := c.buildListOfConditions()
	if err == nil {
		c.listOfConditions.Store(&conditions)
	}
	// NB: There are no relevant case of "failed loads" to monitor in the case of migration schemas
	// at the moment, so we always return 0 for the failed loads count
	return successfulLoadsCount, 0, err
}

func (c *migCuePart) getConditions() string {
	return *c.listOfConditions.Load()
}

func (c *migCuePart) getPlaceholder() string {
	return c.placeholderText
}

func (c *migCuePart) buildListOfConditions() (string, int, error) {
	successfulLoadsCount := 0

	files, err := os.ReadDir(c.schemasPath)
	if err != nil {
		return "", successfulLoadsCount, err
	}

	// gather the content of all migration files found
	var listOfConditions strings.Builder
	for _, file := range files {
		if !file.IsDir() {
			logrus.Tracef("file %s is ignored since we are looking for directories", file.Name())
			continue
		}
		migFilePath := filepath.Join(c.schemasPath, file.Name(), "migrate.cue")
		contentStr, readErr := os.ReadFile(migFilePath)
		if readErr != nil {
			logrus.WithError(readErr).Debugf("No migration file found at %s, plugin %s will be skipped", migFilePath, file.Name())
			continue
		}
		// TODO: validate the content of the migration file (we expect a conditional block, or several ones separated by commas)
		// and track the amount of validation errors in the schemas load monitoring

		listOfConditions.WriteString(string(contentStr))
		listOfConditions.WriteString("\n")
		successfulLoadsCount++
	}

	// append a default conditional for any Grafana plugin that has no corresponding Perses plugin
	listOfConditions.WriteString(fmt.Sprintf(`
	{
		%s
	}`, c.defaultValue))
	listOfConditions.WriteString("\n")

	return listOfConditions.String(), successfulLoadsCount, nil
}
