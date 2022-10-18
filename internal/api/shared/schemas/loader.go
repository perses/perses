// Copyright 2022 The Perses Authors
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

package schemas

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/load"
	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/sirupsen/logrus"
)

type Loader interface {
	Load() error
	GetSchemaPath() string
}

type cueDefs struct {
	Loader
	context     *cue.Context
	baseDef     *cue.Value
	schemas     *sync.Map
	schemasPath string
	kindCuePath string
}

func (c *cueDefs) GetSchemaPath() string {
	return c.schemasPath
}

// Load the list of available plugins as CUE schemas
func (c *cueDefs) Load() error {
	files, err := os.ReadDir(c.schemasPath)
	if err != nil {
		return err
	}

	// newSchemas is used for double buffering, to avoid any issue when there are panels to validate at the same time load() is triggered
	newSchemas := make(map[string]cue.Value)

	// process each schema plugin to convert it into a CUE Value
	for _, file := range files {
		if !file.IsDir() {
			logrus.Warningf("Plugin %s will not be loaded: it is not a folder", file.Name())
			continue
		}

		schemaPath := filepath.Join(c.schemasPath, file.Name())

		// load the cue files into build.Instances slice
		buildInstances := load.Instances([]string{}, &load.Config{Dir: schemaPath})
		// we strongly assume that only 1 buildInstance should be returned, otherwise we skip it
		// TODO can probably be improved
		if len(buildInstances) != 1 {
			logrus.Errorf("Plugin %s will not be loaded: The number of build instances is != 1", schemaPath)
			continue
		}
		buildInstance := buildInstances[0]

		// check for errors on the instances (these are typically parsing errors)
		if buildInstance.Err != nil {
			logrus.WithError(buildInstance.Err).Errorf("Plugin %s will not be loaded: file loading error", schemaPath)
			continue
		}

		// build Value from the Instance
		schema := c.context.BuildInstance(buildInstance)
		if schema.Err() != nil {
			logrus.WithError(schema.Err()).Errorf("Plugin %s will not be loaded: build error", schemaPath)
			continue
		}

		if c.baseDef != nil {
			// unify with the base def to complete defaults + check if the plugin fulfils the base requirements
			schema = c.baseDef.Unify(schema)
			if schema.Err() != nil {
				logrus.WithError(schema.Err()).Errorf("Plugin %s will not be loaded: it doesn't meet the expected format for its plugin type", schemaPath)
				continue
			}
		}
		// check if another schema for the same Kind was already registered
		kind, _ := schema.LookupPath(cue.ParsePath(c.kindCuePath)).String()
		if _, ok := newSchemas[kind]; ok {
			logrus.Warningf("Plugin %s will not be loaded: conflicting schema already exists for kind %s", schemaPath, kind)
			continue
		}

		newSchemas[kind] = schema
		logrus.Debugf("%s plugin loaded from file %s", kind, schemaPath)
	}

	// make c.schemas equal to newSchemas: deep copy newSchemas to c.schemas, then remove any value of c.schemas not existing in newSchemas
	for key, value := range newSchemas {
		c.schemas.Store(key, value)
	}
	c.schemas.Range(func(key interface{}, value interface{}) bool {
		if _, ok := newSchemas[key.(string)]; !ok {
			c.schemas.Delete(key)
		}
		return true
	})
	logrus.Debugf("Schemas at %s (re)loaded", c.schemasPath)
	return nil
}

type cueDefsWithDisjunction struct {
	cueDefs
	disjSchema cue.Value
	// mapID is the identifier of the intermediary map used to build the disjunction schema (e.g #query_types).
	// It should be filled with the same identifier used in the generator schema.
	mapID string
}

func (c *cueDefsWithDisjunction) GetSchemaPath() string {
	return c.schemasPath
}

// Load the list of available plugins as CUE schemas + build a disjunction from it
func (c *cueDefsWithDisjunction) Load() error {
	if err := c.cueDefs.Load(); err != nil {
		return err
	}

	// build a CUE value representing a disjunction of all the possible schemas (A or B or C ...)
	disjSchema := c.context.CompileBytes(queryDisjunctionGenerator)
	c.schemas.Range(func(name any, schema any) bool {
		backup := disjSchema // save current state of disjSchema in case the current schema turns out to be invalid
		disjSchema = disjSchema.FillPath(
			cue.ParsePath(fmt.Sprintf("%s.%s", c.mapID, name)),
			schema.(cue.Value),
		)

		// in case of failure, don't include the faulty schema & continue iterating
		// NB: should not happen since the bad schemas should be filtered out during cueDefs.Load()
		if disjSchema.Err() != nil {
			logrus.WithError(disjSchema.Err()).Errorf("Error injecting schema %s for disjunction", name)
			disjSchema = backup
		}

		return true
	})
	logrus.Tracef("Final disjunction schema: %#v", disjSchema)
	c.disjSchema = disjSchema

	return nil
}

func NewHotReloaders(loaders []Loader) (async.SimpleTask, async.SimpleTask, error) {
	fsWatcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, nil, err
	}

	return &watcher{
			fsWatcher: fsWatcher,
			loaders:   loaders,
		}, &reloader{
			loaders: loaders,
		},
		nil
}

type watcher struct {
	async.Task
	fsWatcher *fsnotify.Watcher
	loaders   []Loader
}

func (w *watcher) String() string {
	return "schemas watcher"
}

func (w *watcher) Initialize() error {
	for _, l := range w.loaders {
		if err := w.fsWatcher.Add(l.GetSchemaPath()); err != nil {
			return err
		}
		logrus.Tracef("Starting to watch %s", l.GetSchemaPath())
	}
	return nil
}

func (w *watcher) Execute(ctx context.Context, cancel context.CancelFunc) error {
	for {
		select {
		case event, ok := <-w.fsWatcher.Events:
			if !ok {
				cancel()
				return fmt.Errorf("schemas watcher channel has been closed unexpectedly")
			}
			// NB room for improvement: the event fsnotify.Remove could be used to actually remove the CUE schema from the map
			if event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Remove == fsnotify.Remove {
				logrus.Tracef("%s event on %s", event.Op, event.Name)
				for _, l := range w.loaders {
					if strings.HasPrefix(event.Name, filepath.FromSlash(l.GetSchemaPath())) {
						if err := l.Load(); err != nil {
							logrus.WithError(err).Errorf("unable to load the schemas in %s", l.GetSchemaPath())
						}
					}
				}
			}
		case err, ok := <-w.fsWatcher.Errors:
			if !ok {
				cancel()
				return fmt.Errorf("schemas watcher channel has been closed unexpectedly")
			}
			logrus.Error(err)
		case <-ctx.Done():
			logrus.Infof("canceled %s", w.String())
			return nil
		}
	}
}

func (w *watcher) Finalize() error {
	return w.fsWatcher.Close()
}

type reloader struct {
	async.SimpleTask
	loaders []Loader
}

func (r *reloader) String() string {
	return "schemas reloader"
}

func (r *reloader) Execute(ctx context.Context, _ context.CancelFunc) error {
	select {
	case <-ctx.Done():
		logrus.Infof("canceled %s", r.String())
		break
	default:
		for _, l := range r.loaders {
			if err := l.Load(); err != nil {
				logrus.WithError(err).Errorf("unable to load a schema")
			}
		}
	}
	return nil
}
