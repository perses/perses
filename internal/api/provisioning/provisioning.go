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

package provisioning

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/dependency"
	"github.com/sirupsen/logrus"
)

// watchDebounce is the quiet period after the last filesystem event before a reload is
// triggered. This batches rapid successive changes (e.g. a directory of files being
// written at once) into a single applyEntity call.
// watchDebounce is the quiet period after the last filesystem event before a reload is
// triggered. 500ms gives enough time for tools that write multiple files sequentially
// (e.g. a DAC build outputting several YAML files) to finish before we reload once.
const watchDebounce = 500 * time.Millisecond

func New(serviceManager dependency.ServiceManager, folders []string, caseSensitive bool) (async.SimpleTask, async.SimpleTask) {
	svc := &provisioningService{
		serviceManager: serviceManager,
		caseSensitive:  caseSensitive,
	}
	return &provisioningTask{
			folders: folders,
			svc:     svc,
		}, &provisioningWatcher{
			folders: folders,
			svc:     svc,
		}
}

type provisioningTask struct {
	svc     provisioningServiceInterface
	folders []string
}

type provisioningWatcher struct {
	svc     provisioningServiceInterface
	folders []string
}

func (p *provisioningTask) Execute(_ context.Context, _ context.CancelFunc) error {
	if len(p.folders) == 0 {
		return nil
	}
	p.svc.reloadAllEntities(p.folders)
	return nil
}

func (p *provisioningTask) String() string {
	return "provisioning task service"
}

// Execute watches all configured folders recursively for changes and calls reload
// whenever a relevant filesystem event is detected.
//
// Kubernetes compatibility: ConfigMaps are mounted via atomic double-symlink swaps
// (..data → ..timestamp). fsnotify watching directories (not files) naturally catches
// these RENAME events. On each Rename/Remove we re-register all directories so the
// watcher follows the new inodes. A short debounce window batches bursts of events
// into a single reload.
func (p *provisioningWatcher) Execute(ctx context.Context, _ context.CancelFunc) error {
	if len(p.folders) == 0 {
		return nil
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("unable to create provisioning watcher: %w", err)
	}
	defer func() {
		if closeErr := watcher.Close(); closeErr != nil {
			logrus.WithError(closeErr).Error("failed to close provisioning watcher")
		}
	}()

	if registerErr := p.registerFoldersRecursively(watcher); registerErr != nil {
		return fmt.Errorf("unable to register folders for watching: %w", registerErr)
	}

	var debounceC <-chan time.Time

	for {
		select {
		case <-ctx.Done():
			return nil

		case event, ok := <-watcher.Events:
			if !ok {
				return nil
			}
			logrus.Debugf("provisioning watcher: %s %q", event.Op, event.Name)

			// CHMOD only changes file permissions, not content – ignore it to
			// avoid spurious reloads triggered by the OS or antivirus tools
			// that chmod files after a write.
			if event.Op == fsnotify.Chmod {
				continue
			}

			if event.Has(fsnotify.Create) {
				if info, statErr := os.Stat(event.Name); statErr == nil && info.IsDir() {
					if watchErr := watcher.Add(event.Name); watchErr != nil {
						logrus.WithError(watchErr).Warningf("unable to watch new directory %q", event.Name)
					}
				}
			}

			if event.Has(fsnotify.Rename) || event.Has(fsnotify.Remove) {
				_ = p.registerFoldersRecursively(watcher)
			}

			debounceC = time.After(watchDebounce)

		case watchErr, ok := <-watcher.Errors:
			if !ok {
				return nil
			}
			logrus.WithError(watchErr).Error("provisioning watcher error")

		case <-debounceC:
			debounceC = nil
			p.svc.reloadAllEntities(p.folders)
		}
	}
}

func (p *provisioningWatcher) String() string {
	return "provisioning watcher service"
}

func (p *provisioningWatcher) registerFoldersRecursively(watcher *fsnotify.Watcher) error {
	for _, dir := range p.folders {
		if err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				logrus.WithError(err).Warningf("unable to access %q while registering watcher", path)
				return nil
			}
			if d.IsDir() {
				if watchErr := watcher.Add(path); watchErr != nil {
					logrus.WithError(watchErr).Warningf("unable to watch directory %q", path)
				}
			}
			return nil
		}); err != nil {
			return err
		}
	}
	return nil
}
