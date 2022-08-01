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
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/config"
	"github.com/sirupsen/logrus"
	log "github.com/sirupsen/logrus"
)

type watcher struct {
	async.Task
	fsWatcher   *fsnotify.Watcher
	panelsPath  string
	queriesPath string
	validator   Validator
}

type reloader struct {
	async.SimpleTask
	validator Validator
}

func NewHotReloaders(conf config.Schemas, v Validator) (async.SimpleTask, async.SimpleTask, error) {
	fsWatcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, nil, err
	}

	return &watcher{
			fsWatcher:   fsWatcher,
			panelsPath:  conf.PanelsPath,
			queriesPath: conf.QueriesPath,
			validator:   v,
		}, &reloader{
			validator: v,
		},
		nil
}

// Initialize implements async.Task.Initialize
func (w *watcher) Initialize() error {
	var err error
	err = w.fsWatcher.Add(w.panelsPath)
	if err != nil {
		return err
	}
	logrus.Tracef("Started watching %s", w.panelsPath)

	err = w.fsWatcher.Add(w.queriesPath)
	if err != nil {
		return err
	}
	logrus.Tracef("Started watching %s", w.queriesPath)

	return nil
}

// String implements fmt.Stringer
func (w *watcher) String() string {
	return "schemas watcher"
}

// Execute implements cron.Executor.Execute
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
				if strings.HasPrefix(event.Name, filepath.FromSlash(w.panelsPath)) {
					w.validator.LoadPanels()
				} else if strings.HasPrefix(event.Name, filepath.FromSlash(w.queriesPath)) {
					w.validator.LoadQueries()
				} else {
					logrus.Debugf("no match for %s or %s", w.panelsPath, w.queriesPath)
				}
			}
		case err, ok := <-w.fsWatcher.Errors:
			if !ok {
				cancel()
				return fmt.Errorf("schemas watcher channel has been closed unexpectedly")
			}
			logrus.Error(err)
		case <-ctx.Done():
			log.Infof("canceled %s", w.String())
			return nil
		}
	}
}

// Finalize implements async.Task.Finalize
func (w *watcher) Finalize() error {
	return w.fsWatcher.Close()
}

// String implements fmt.Stringer
func (r *reloader) String() string {
	return "schemas reloader"
}

// Execute implements cron.Executor.Execute
func (r *reloader) Execute(ctx context.Context, _ context.CancelFunc) error {
	select {
	case <-ctx.Done():
		log.Infof("canceled %s", r.String())
		break
	default:
		r.validator.LoadPanels()
		r.validator.LoadQueries()
	}
	return nil
}
