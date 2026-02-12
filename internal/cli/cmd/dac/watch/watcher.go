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
	"strings"
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
	changedFiles  map[string]bool // Track files changed during debounce period
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
		changedFiles:  make(map[string]bool),
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

	// Initial build - build all dashboard files
	fmt.Fprintf(w.writer, "🔨 Running initial build...\n")
	w.buildAllDashboards()

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

			fmt.Fprintf(w.writer, "📝 File event: %s (%s)\n", event.Name, event.Op)

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
				// Track the changed file
				w.changedFiles[event.Name] = true
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
			w.rebuildAffectedFiles()

		case err := <-fsWatcher.Errors:
			fmt.Fprintf(w.errWriter, "⚠️ Watcher error: %v\n", err)
		}
	}
}

// rebuildAffectedFiles rebuilds only the files that changed, with fallback to full rebuild
func (w *watcher) rebuildAffectedFiles() {
	if len(w.changedFiles) == 0 {
		return
	}

	// Get list of changed files
	filesToBuild := make([]string, 0, len(w.changedFiles))
	for file := range w.changedFiles {
		filesToBuild = append(filesToBuild, file)
	}
	// Clear the changed files map
	w.changedFiles = make(map[string]bool)

	fmt.Fprintf(w.writer, "🔄 Changes detected in %d file(s), rebuilding...\n", len(filesToBuild))

	// Check if any changed files are library/shared files (not buildable as main packages)
	hasLibraryFiles := false
	for _, file := range filesToBuild {
		isLib := w.isLibraryFile(file)
		fmt.Fprintf(w.writer, "   - %s (library: %v)\n", file, isLib)
		if isLib {
			hasLibraryFiles = true
		}
	}

	// If library files changed, do full rebuild
	// TODO: Phase 2 - Parse imports and rebuild only affected dashboards
	if hasLibraryFiles {
		fmt.Fprintf(w.writer, "Library file(s) changed, rebuilding all dashboards...\n")
		w.buildAllDashboards()
		return
	} else if len(filesToBuild) > 10 {
		// Too many files changed, do full rebuild
		fmt.Fprintf(w.writer, "Multiple files changed, rebuilding all dashboards...\n")
		w.buildAllDashboards()
		return
	} else {
		// Build each changed file individually
		hasErrors := false
		for _, file := range filesToBuild {
			if err := w.buildFile(file); err != nil {
				fmt.Fprintf(w.errWriter, "❌ Build failed for %s: %v\n", file, err)
				hasErrors = true
			}
		}
		if hasErrors {
			return
		}
	}

	fmt.Fprintf(w.writer, "✅ Build successful!\n")
	// Notify build completion (non-blocking)
	select {
	case w.buildChan <- struct{}{}:
	default:
	}
}

// buildFile builds a single file using the build option
func (w *watcher) buildFile(file string) error {
	// Create a temporary build option for this specific file
	fileOpt := &build.Option{
		FileOption:   opt.FileOption{File: file},
		OutputOption: w.buildOption.OutputOption,
		Mode:         "file",
	}
	fileOpt.SetWriter(w.writer)
	fileOpt.SetErrWriter(w.errWriter)
	return fileOpt.Run()
}

// findDashboardFiles finds all dashboard files (main packages) in the source directory
func (w *watcher) findDashboardFiles() []string {
	var dashboards []string
	filepath.Walk(w.sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			// Skip ignored directories
			name := info.Name()
			if name == "vendor" || name == "node_modules" || name == ".git" || name == w.buildDir {
				return filepath.SkipDir
			}
			return nil
		}

		ext := filepath.Ext(path)
		if ext == ".go" || ext == ".cue" {
			// Check if it's NOT a library file
			if !w.isLibraryFile(path) {
				dashboards = append(dashboards, path)
			}
		}
		return nil
	})
	return dashboards
}

// buildAllDashboards builds all dashboard files in the source directory
func (w *watcher) buildAllDashboards() {
	dashboards := w.findDashboardFiles()
	if len(dashboards) == 0 {
		fmt.Fprintf(w.writer, "⚠️  No dashboard files found\n")
		return
	}

	fmt.Fprintf(w.writer, "Building %d dashboard(s)...\n", len(dashboards))
	hasErrors := false
	successCount := 0

	for _, file := range dashboards {
		if err := w.buildFile(file); err != nil {
			fmt.Fprintf(w.errWriter, "❌ Build failed for %s: %v\n", file, err)
			hasErrors = true
		} else {
			successCount++
		}
	}

	if hasErrors {
		fmt.Fprintf(w.writer, "⚠️  Build completed with errors (%d/%d succeeded)\n", successCount, len(dashboards))
	} else {
		fmt.Fprintf(w.writer, "✅ Build successful! (%d dashboard(s))\n", len(dashboards))
		// Notify build completion (non-blocking)
		select {
		case w.buildChan <- struct{}{}:
		default:
		}
	}
}

// isLibraryFile checks if a file is a library/shared file that shouldn't be built directly
func (w *watcher) isLibraryFile(file string) bool {
	// Library files are typically in directories like: library/, lib/, pkg/, shared/, etc.
	// Dashboard files are typically in: dashboards/, or are direct main.go files
	relPath, err := filepath.Rel(w.sourceDir, file)
	if err != nil {
		return false
	}

	// Check if file is NOT in a dashboards directory
	// Common patterns: dashboards/, dashboard/, or files directly in root with main package
	dir := filepath.Dir(relPath)
	if dir == "." {
		return false // Files in root are likely main dashboards
	}

	// Check if path contains "dashboard" - likely a dashboard file
	if strings.Contains(strings.ToLower(relPath), "dashboard") {
		return false
	}

	// Otherwise, it's likely a library file
	return true
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
