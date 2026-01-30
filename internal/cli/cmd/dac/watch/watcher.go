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

package watch

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/cli/cmd/dac/build"
	"github.com/perses/perses/internal/cli/opt"
)

type watcher struct {
	async.SimpleTask
	sourceDir     string
	buildDir      string
	debounceDelay time.Duration
	writer        io.Writer
	errWriter     io.Writer
	buildChan     chan struct{}
	buildOption   *build.Option
}

// newWatcher creates a new file watcher that monitors DaC files and triggers rebuilds
func newWatcher(sourceDir, buildDir, outputFormat string, buildArgs []string, debounceDelay time.Duration, writer, errWriter io.Writer) *watcher {
	// Create build option to reuse build logic
	buildOpt := &build.Option{
		DirectoryOption: opt.DirectoryOption{Directory: sourceDir},
		OutputOption:    opt.OutputOption{Output: outputFormat},
		Mode:            "file",
	}
	buildOpt.SetWriter(writer)
	buildOpt.SetErrWriter(errWriter)

	return &watcher{
		sourceDir:     sourceDir,
		buildDir:      buildDir,
		debounceDelay: debounceDelay,
		writer:        writer,
		errWriter:     errWriter,
		buildChan:     make(chan struct{}, 1),
		buildOption:   buildOpt,
	}
}

// Execute runs the main watch loop, monitoring files and triggering rebuilds on changes
func (w *watcher) Execute(ctx context.Context, _ context.CancelFunc) error {
	fsWatcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer fsWatcher.Close()

	// Watch source directory recursively
	if err := w.addWatchRecursive(fsWatcher, w.sourceDir); err != nil {
		return err
	}

	fmt.Fprintf(w.writer, "👀 Watching %s for changes...\n", w.sourceDir)

	// Initial build using build command logic
	if err := w.buildOption.Run(); err != nil {
		fmt.Fprintf(w.errWriter, "❌ Initial build failed: %v\n", err)
	}

	var debounceTimer *time.Timer
	var debouncePending bool

	for {
		select {
		case <-ctx.Done():
			close(w.buildChan)
			return ctx.Err()

		case event := <-fsWatcher.Events:
			if !w.shouldRebuild(event) {
				continue
			}

			// Handle new directories
			if event.Op&fsnotify.Create == fsnotify.Create {
				info, err := os.Stat(event.Name)
				if err == nil && info.IsDir() {
					if err := w.addWatchRecursive(fsWatcher, event.Name); err != nil {
						fmt.Fprintf(w.errWriter, "Failed to watch new directory %s: %v\n", event.Name, err)
					}
				}
			}

			if event.Op&(fsnotify.Write|fsnotify.Create) != 0 {
				if debounceTimer == nil {
					debounceTimer = time.NewTimer(w.debounceDelay)
				} else if !debouncePending {
					debounceTimer.Reset(w.debounceDelay)
				}
				debouncePending = true
			}

		case <-func() <-chan time.Time {
			if debounceTimer != nil {
				return debounceTimer.C
			}
			return nil
		}():
			debouncePending = false
			fmt.Fprintf(w.writer, "🔄 Changes detected, rebuilding...\n")
			if err := w.buildOption.Run(); err != nil {
				fmt.Fprintf(w.errWriter, "❌ Build failed: %v\n", err)
			} else {
				fmt.Fprintf(w.writer, "✅ Build successful!\n")
				// Notify build completion (non-blocking)
				select {
				case w.buildChan <- struct{}{}:
				default:
				}
			}

		case err := <-fsWatcher.Errors:
			fmt.Fprintf(w.errWriter, "⚠️ Watcher error: %v\n", err)
		}
	}
}

// shouldRebuild determines if a file change event should trigger a rebuild (.go or .cue files)
func (w *watcher) shouldRebuild(event fsnotify.Event) bool {
	// Watch .go and .cue files
	ext := filepath.Ext(event.Name)
	return ext == ".go" || ext == ".cue"
}

// addWatchRecursive recursively adds directories to the file watcher, skipping ignored folders
func (w *watcher) addWatchRecursive(watcher *fsnotify.Watcher, root string) error {
	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			// Skip vendor, node_modules, .git, build output folder
			name := info.Name()
			if name == "vendor" || name == "node_modules" || name == ".git" || name == w.buildDir {
				return filepath.SkipDir
			}
			return watcher.Add(path)
		}
		return nil
	})
}

// GetBuildNotifications returns a channel that signals when a build completes
func (w *watcher) GetBuildNotifications() <-chan struct{} {
	return w.buildChan
}

// String returns a human-readable description of the watcher task
func (w *watcher) String() string {
	return "DaC file watcher"
}
