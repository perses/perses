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
	"go/parser"
	"go/token"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	cueparser "cuelang.org/go/cue/parser"
	"github.com/fsnotify/fsnotify"
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/cli/cmd/dac/build"
	"github.com/perses/perses/internal/cli/opt"
)

// fileExists checks if a file or directory exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

type watcher struct {
	async.SimpleTask
	sourceDir     string
	buildDir      string
	debounceDelay time.Duration
	writer        io.Writer
	errWriter     io.Writer
	buildChan     chan struct{}
	buildOption   *build.Option
	changedFiles  map[string]bool     // Track files changed during debounce period
	dependencyMap map[string][]string // Maps library files to dashboard files that import them
	allDashboards map[string]bool     // Track all known dashboard files for deletion detection
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

	w := &watcher{
		sourceDir:     sourceDir,
		buildDir:      buildDir,
		debounceDelay: debounceDelay,
		writer:        writer,
		errWriter:     errWriter,
		buildChan:     make(chan struct{}, 1),
		buildOption:   buildOpt,
		changedFiles:  make(map[string]bool),
		dependencyMap: make(map[string][]string),
	}
	// Build initial dependency map
	w.buildDependencyMap()
	return w
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
	fmt.Fprintf(w.writer, "📊 Dependency tracking enabled (%d library -> dashboard mappings)\n", len(w.dependencyMap))

	var debounceTimer *time.Timer
	var debouncePending bool

	for {
		select {
		case <-ctx.Done():
			close(w.buildChan)
			return ctx.Err()

		case event := <-fsWatcher.Events:
			// Handle deletions (REMOVE or RENAME where file no longer exists)
			if event.Op&fsnotify.Remove != 0 || (event.Op&fsnotify.Rename != 0 && !fileExists(event.Name)) {
				// Could be a file or directory deletion - rebuild dependency map
				fmt.Fprintf(w.writer, "📝 File/directory removed: %s\n", event.Name)

				// Get list of all dashboards we knew about BEFORE the deletion
				// Must use cached state, not filesystem scan (folder already deleted!)
				dashboardsBefore := make(map[string]bool)
				for dash := range w.allDashboards {
					dashboardsBefore[dash] = true
				}

				fmt.Fprintf(w.writer, "   Rebuilding dependency map...\n")
				w.buildDependencyMap()

				// Find removed dashboards by comparing before/after
				for dashboard := range dashboardsBefore {
					if !w.allDashboards[dashboard] {
						relPath, _ := filepath.Rel(w.sourceDir, dashboard)
						fmt.Fprintf(w.writer, "   ❌ Dashboard removed: %s\n", relPath)
					}
				}

				continue
			}

			// Handle new directories BEFORE checking file extensions
			// (directories don't have .go/.cue extensions but still need to be tracked)
			if event.Op&(fsnotify.Create|fsnotify.Rename) != 0 {
				info, err := os.Stat(event.Name)
				if err == nil && info.IsDir() {
					if err := w.addWatchRecursive(fsWatcher, event.Name); err != nil {
						fmt.Fprintf(w.errWriter, "Failed to watch new directory %s: %v\n", event.Name, err)
					} else {
						// Directory created or renamed - scan for existing files and rebuild dependency map
						fmt.Fprintf(w.writer, "   New directory detected: %s\n", event.Name)

						// Scan for dashboard files in the new directory
						// (copying a folder means files are already there, not created individually)
						filepath.Walk(event.Name, func(path string, info os.FileInfo, err error) error {
							if err != nil || info.IsDir() {
								return nil
							}
							ext := filepath.Ext(path)
							if (ext == ".go" || ext == ".cue") && !w.isLibraryFile(path) {
								w.changedFiles[path] = true
								fmt.Fprintf(w.writer, "   Found new dashboard: %s\n", path)
							}
							return nil
						})

						// Rebuild dependency map to include new files
						w.buildDependencyMap()

						// Trigger build if we found dashboard files
						if len(w.changedFiles) > 0 {
							if debounceTimer == nil {
								debounceTimer = time.NewTimer(w.debounceDelay)
							} else if !debouncePending {
								debounceTimer.Reset(w.debounceDelay)
							}
							debouncePending = true
						}
					}
					continue
				}
			}

			// Now check if it's a file we care about (.go or .cue)
			if !w.shouldRebuild(event) {
				continue
			}

			fmt.Fprintf(w.writer, "📝 File event: %s (%s)\n", event.Name, event.Op)

			// Handle file operations: CREATE, WRITE, RENAME (move)
			if event.Op&(fsnotify.Write|fsnotify.Create|fsnotify.Rename) != 0 {
				// Track the changed file
				w.changedFiles[event.Name] = true

				// If it's a CREATE or RENAME, rebuild dependency map to discover new files
				if event.Op&(fsnotify.Create|fsnotify.Rename) != 0 {
					w.buildDependencyMap()
				} else if !w.isLibraryFile(event.Name) {
					// For WRITE on existing dashboards, rebuild dependency map to catch new imports
					w.buildDependencyMap()
				}

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

	// If library files changed, find and rebuild affected dashboards
	if hasLibraryFiles {
		affectedDashboards := w.findAffectedDashboards(filesToBuild)
		if len(affectedDashboards) == 0 {
			// Fallback: if we can't determine dependencies, rebuild all
			fmt.Fprintf(w.writer, "Library file(s) changed (dependencies unknown), rebuilding all dashboards...\n")
			w.buildAllDashboards()
			return
		}
		fmt.Fprintf(w.writer, "Library file(s) changed, rebuilding %d affected dashboard(s)...\n", len(affectedDashboards))
		for _, dashboard := range affectedDashboards {
			relPath, _ := filepath.Rel(w.sourceDir, dashboard)
			fmt.Fprintf(w.writer, "   → %s\n", relPath)
		}
		hasErrors := false
		for _, dashboard := range affectedDashboards {
			if err := w.buildFile(dashboard); err != nil {
				fmt.Fprintf(w.errWriter, "❌ Build failed for %s: %v\n", dashboard, err)
				hasErrors = true
			}
		}
		if !hasErrors {
			fmt.Fprintf(w.writer, "✅ Build successful!\n")
			select {
			case w.buildChan <- struct{}{}:
			default:
			}
		}
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
	ext := filepath.Ext(file)

	if ext == ".go" {
		return w.isGoLibraryFile(file)
	} else if ext == ".cue" {
		return w.isCueLibraryFile(file)
	}

	return true // Unknown files are libraries by default
}

// isGoLibraryFile checks if a Go file is a library (not a main package)
func (w *watcher) isGoLibraryFile(file string) bool {
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, file, nil, parser.PackageClauseOnly)
	if err != nil {
		return true // Can't parse = treat as library
	}

	// Go dashboards MUST be "package main"
	return node.Name.Name != "main"
}

// isCueLibraryFile checks if a CUE file is a library based on import patterns and filename
func (w *watcher) isCueLibraryFile(file string) bool {
	content, err := os.ReadFile(file)
	if err != nil {
		return true
	}

	parsed, err := cueparser.ParseFile(file, content)
	if err != nil {
		return true
	}

	// Strategy 1: Check for named import "dashboardBuilder"
	for imp := range parsed.ImportSpecs() {
		if imp.Name != nil && imp.Name.String() == "dashboardBuilder" {
			return false // This is a dashboard file!
		}
	}

	// Strategy 2: Check if filename contains "dashboard"
	if strings.Contains(strings.ToLower(filepath.Base(file)), "dashboard") {
		return false // This is a dashboard file!
	}

	return true // It's a library file
}

// findAllDependencies recursively finds all dependencies (direct + transitive) for a file
func (w *watcher) findAllDependencies(file string, visited map[string]bool) map[string]bool {
	deps := make(map[string]bool)

	// Prevent infinite loops from circular imports
	if visited[file] {
		return deps
	}
	visited[file] = true

	// Get direct imports
	imports := w.parseImports(file)

	for _, importPath := range imports {
		libraryFiles := w.resolveImportToFiles(importPath)

		for _, libFile := range libraryFiles {
			// Add this library file
			deps[libFile] = true

			// Recursively get its dependencies (transitive)
			transitiveDeps := w.findAllDependencies(libFile, visited)
			for transFile := range transitiveDeps {
				deps[transFile] = true
			}
		}
	}

	return deps
}

// buildDependencyMap builds a map of library files to dashboards that import them (including transitive dependencies)
func (w *watcher) buildDependencyMap() {
	w.dependencyMap = make(map[string][]string)
	dashboards := w.findDashboardFiles()

	// Track all dashboards for deletion detection
	w.allDashboards = make(map[string]bool)
	for _, dash := range dashboards {
		w.allDashboards[dash] = true
	}

	fmt.Fprintf(w.writer, "🔍 Building dependency graph (including transitive dependencies)...\n")

	for _, dashboard := range dashboards {
		// Recursively find ALL dependencies (direct + transitive)
		allDeps := w.findAllDependencies(dashboard, make(map[string]bool))

		for libFile := range allDeps {
			w.dependencyMap[libFile] = append(w.dependencyMap[libFile], dashboard)
		}
	}

	// Log dependency map summary
	if len(w.dependencyMap) > 0 {
		fmt.Fprintf(w.writer, "   Found %d library file(s) with dependencies\n", len(w.dependencyMap))
		for libFile, dashboards := range w.dependencyMap {
			relLib, _ := filepath.Rel(w.sourceDir, libFile)
			fmt.Fprintf(w.writer, "   - %s → %d dashboard(s)\n", relLib, len(dashboards))
		}
	} else {
		fmt.Fprintf(w.writer, "   No library dependencies found\n")
	}
}

// parseImports extracts import paths from a Go or CUE file
func (w *watcher) parseImports(filePath string) []string {
	ext := filepath.Ext(filePath)
	if ext == ".go" {
		return w.parseGoImports(filePath)
	} else if ext == ".cue" {
		return w.parseCueImports(filePath)
	}
	return nil
}

// parseGoImports parses import statements from a Go file
func (w *watcher) parseGoImports(filePath string) []string {
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filePath, nil, parser.ImportsOnly)
	if err != nil {
		return nil
	}

	var imports []string
	for _, imp := range node.Imports {
		importPath := strings.Trim(imp.Path.Value, `"`)
		imports = append(imports, importPath)
	}
	return imports
}

// parseCueImports parses import statements from a CUE file using the official parser
func (w *watcher) parseCueImports(filePath string) []string {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil
	}

	// Parse the CUE file using the official parser
	file, err := cueparser.ParseFile(filePath, content)
	if err != nil {
		return nil
	}

	var imports []string
	for imp := range file.ImportSpecs() {
		if imp.Path != nil {
			// Import path includes quotes, so we need to trim them
			importPath := strings.Trim(imp.Path.Value, `"`)
			imports = append(imports, importPath)
		}
	}
	return imports
}

// resolveImportToFiles attempts to resolve an import path to actual library files
func (w *watcher) resolveImportToFiles(importPath string) []string {
	var files []string

	// For local imports, we need to find the directory that matches the import path
	// Import examples:
	//   "dac-example.com/m/mylibrary/variables" -> should match mylibrary/variables/
	//   "dac-example.com/m/mylibrary/panels" -> should match mylibrary/panels/

	// Look for directories matching the import in the source tree
	filepath.Walk(w.sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			return nil
		}

		// Skip ignored directories
		name := info.Name()
		if name == "vendor" || name == "node_modules" || name == ".git" || name == w.buildDir {
			return filepath.SkipDir
		}

		// Get relative path from source directory
		relPath, err := filepath.Rel(w.sourceDir, path)
		if err != nil {
			return nil
		}

		// Normalize path separators for comparison
		relPathNormalized := filepath.ToSlash(relPath)

		// Check if the import path ends with this relative path
		// This ensures we match the exact directory structure
		if strings.HasSuffix(importPath, relPathNormalized) ||
			strings.HasSuffix(importPath, "/"+relPathNormalized) {
			// Add all .go and .cue files from this directory (non-recursive)
			entries, err := os.ReadDir(path)
			if err != nil {
				return nil
			}
			for _, entry := range entries {
				if entry.IsDir() {
					continue
				}
				filePath := filepath.Join(path, entry.Name())
				ext := filepath.Ext(filePath)
				if (ext == ".go" || ext == ".cue") && w.isLibraryFile(filePath) {
					files = append(files, filePath)
				}
			}
			return filepath.SkipDir
		}
		return nil
	})

	return files
}

// findAffectedDashboards returns dashboard files that depend on the given changed files
func (w *watcher) findAffectedDashboards(changedFiles []string) []string {
	dashboardSet := make(map[string]bool)

	for _, changedFile := range changedFiles {
		if !w.isLibraryFile(changedFile) {
			continue
		}

		// Look up dashboards that depend on this library file
		if dashboards, exists := w.dependencyMap[changedFile]; exists {
			for _, dashboard := range dashboards {
				// Check if the dashboard file still exists
				if _, err := os.Stat(dashboard); err == nil {
					dashboardSet[dashboard] = true
				}
			}
		}
	}

	// Convert set to slice
	result := make([]string, 0, len(dashboardSet))
	for dashboard := range dashboardSet {
		result = append(result, dashboard)
	}
	return result
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
