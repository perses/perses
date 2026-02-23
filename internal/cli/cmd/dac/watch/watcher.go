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
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/opt"
	"github.com/sirupsen/logrus"
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

	// Initial build - build all dashboard files
	logrus.Debug("🔨 Running initial build...")
	w.buildAllDashboards()
	logrus.Debugf("📊 Dependency tracking enabled (%d library -> dashboard mappings)", len(w.dependencyMap))

	var debounceTimer *time.Timer
	var debouncePending bool

	for {
		select {
		case <-ctx.Done():
			close(w.buildChan)
			logrus.Info("Watch stopped")
			return nil

		case event := <-fsWatcher.Events:
			// Handle deletions (REMOVE or RENAME where file no longer exists)
			if event.Op&fsnotify.Remove != 0 || (event.Op&fsnotify.Rename != 0 && !fileExists(event.Name)) {
				// Could be a file or directory deletion - rebuild dependency map
				logrus.Debugf("📝 File/directory removed: %s", event.Name)

				// Get list of all dashboards we knew about BEFORE the deletion
				// Must use cached state, not filesystem scan (folder already deleted!)
				dashboardsBefore := make(map[string]bool)
				for dash := range w.allDashboards {
					dashboardsBefore[dash] = true
				}

				logrus.Debug("   Rebuilding dependency map...")
				w.buildDependencyMap()

				// Find removed dashboards by comparing before/after
				for dashboard := range dashboardsBefore {
					if !w.allDashboards[dashboard] {
						relPath, _ := filepath.Rel(w.sourceDir, dashboard)
						logrus.Debugf("   ❌ Dashboard removed: %s", relPath)
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
						logrus.Errorf("Failed to watch new directory %s: %v", event.Name, err)
					} else {
						// Directory created or renamed - scan for existing files and rebuild dependency map
						logrus.Debugf("   New directory detected: %s", event.Name)

						// Scan for dashboard files in the new directory
						// (copying a folder means files are already there, not created individually)
						filepath.Walk(event.Name, func(path string, info os.FileInfo, err error) error {
							if err != nil || info.IsDir() {
								return nil
							}
							ext := filepath.Ext(path)
							if (ext == ".go" || ext == ".cue") && w.isDashboardFile(path) {
								w.changedFiles[path] = true
								logrus.Debugf("   Found new dashboard: %s", path)
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

			logrus.Debugf("📝 File event: %s (%s)", event.Name, event.Op)

			// Handle file operations: CREATE, WRITE, RENAME (move)
			if event.Op&(fsnotify.Write|fsnotify.Create|fsnotify.Rename) != 0 {
				// Track the changed file
				w.changedFiles[event.Name] = true

				// If it's a CREATE or RENAME, rebuild dependency map to discover new files
				if event.Op&(fsnotify.Create|fsnotify.Rename) != 0 {
					w.buildDependencyMap()
				} else if w.isDashboardFile(event.Name) {
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
			logrus.Warnf("⚠️ Watcher error: %v", err)
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

	logrus.Debugf("🔄 Changes detected in %d file(s), rebuilding...", len(filesToBuild))

	// Check if any changed files are library/shared files (not buildable as main packages)
	hasLibraryFiles := false
	for _, file := range filesToBuild {
		isDash := w.isDashboardFile(file)
		logrus.Debugf("   - %s (library: %v)", file, !isDash)
		if !isDash {
			hasLibraryFiles = true
		}
	}

	// If library files changed, find and rebuild affected dashboards
	if hasLibraryFiles {
		affectedDashboards := w.findAffectedDashboards(filesToBuild)
		if len(affectedDashboards) == 0 {
			// Fallback: if we can't determine dependencies, rebuild all
			logrus.Debug("Library file(s) changed (dependencies unknown), rebuilding all dashboards...")
			w.buildAllDashboards()
			return
		}
		logrus.Debugf("Library file(s) changed, rebuilding %d affected dashboard(s)...", len(affectedDashboards))
		if logrus.IsLevelEnabled(logrus.DebugLevel) {
			for _, dashboard := range affectedDashboards {
				relPath, _ := filepath.Rel(w.sourceDir, dashboard)
				logrus.Debugf("   → %s", relPath)
			}
		}
		hasErrors := false
		for _, dashboard := range affectedDashboards {
			outputPath, err := w.buildFile(dashboard)
			if err != nil {
				logrus.Errorf("❌ Build failed for %s: %v", dashboard, err)
				hasErrors = true
			} else {
				logrus.Debugf("Successfully built %s at %s", dashboard, outputPath)
			}
		}
		if !hasErrors {
			logrus.Debug("✅ Build successful!")
			select {
			case w.buildChan <- struct{}{}:
			default:
			}
		}
		return
	} else if len(filesToBuild) > 10 {
		// Too many files changed, do full rebuild
		logrus.Debug("Multiple files changed, rebuilding all dashboards...")
		w.buildAllDashboards()
		return
	} else {
		// Build each changed file individually
		hasErrors := false
		for _, file := range filesToBuild {
			outputPath, err := w.buildFile(file)
			if err != nil {
				logrus.Errorf("❌ Build failed for %s: %v", file, err)
				hasErrors = true
			} else {
				logrus.Debugf("Successfully built %s at %s", file, outputPath)
			}
		}
		if hasErrors {
			return
		}
	}

	logrus.Debug("✅ Build successful!")
	// Notify build completion (non-blocking)
	select {
	case w.buildChan <- struct{}{}:
	default:
	}
}

// buildFile builds a single file using the build option and returns the output path
func (w *watcher) buildFile(file string) (string, error) {
	// Create a temporary build option for this specific file
	fileOpt := &build.Option{
		FileOption:   opt.FileOption{File: file},
		OutputOption: w.buildOption.OutputOption,
		Mode:         "file",
	}
	// Suppress build option's own output - we'll log via logrus instead
	fileOpt.SetWriter(io.Discard)
	fileOpt.SetErrWriter(w.errWriter)

	err := fileOpt.Run()
	if err != nil {
		return "", err
	}

	// Compute output path (same logic as build.Option.buildOutputFilePath)
	baseName := strings.TrimSuffix(file, filepath.Ext(file))
	outputPath := filepath.Join(config.Global.Dac.OutputFolder, fmt.Sprintf("%s_output.%s", baseName, w.buildOption.Output))

	return outputPath, nil
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
			// Check if it's a dashboard file
			if w.isDashboardFile(path) {
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
		logrus.Warn("⚠️  No dashboard files found")
		return
	}

	logrus.Debugf("Building %d dashboard(s)...", len(dashboards))
	hasErrors := false
	successCount := 0

	for _, file := range dashboards {
		outputPath, err := w.buildFile(file)
		if err != nil {
			logrus.Errorf("❌ Build failed for %s: %v", file, err)
			hasErrors = true
		} else {
			logrus.Debugf("Successfully built %s at %s", file, outputPath)
			successCount++
		}
	}

	if hasErrors {
		logrus.Warnf("⚠️  Build completed with errors (%d/%d succeeded)", successCount, len(dashboards))
	} else {
		logrus.Debugf("✅ Build successful! (%d dashboard(s))", len(dashboards))
	}

	if !hasErrors {
		// Notify build completion (non-blocking)
		select {
		case w.buildChan <- struct{}{}:
		default:
		}
	}
}

// isDashboardFile checks if a file is a dashboard file that should be built directly
func (w *watcher) isDashboardFile(file string) bool {
	ext := filepath.Ext(file)

	if ext == ".go" {
		return w.isGoDashboardFile(file)
	} else if ext == ".cue" {
		return w.isCueDashboardFile(file)
	}

	return false // Unknown files are not dashboards by default
}

// isGoDashboardFile checks if a Go file is a dashboard (main package)
func (w *watcher) isGoDashboardFile(file string) bool {
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, file, nil, parser.PackageClauseOnly)
	if err != nil {
		return false // Can't parse = not a dashboard
	}

	// Go dashboards MUST be "package main"
	return node.Name.Name == "main"
}

// isCueDashboardFile checks if a CUE file is a dashboard based on import patterns and filename
func (w *watcher) isCueDashboardFile(file string) bool {
	content, err := os.ReadFile(file)
	if err != nil {
		return false
	}

	parsed, err := cueparser.ParseFile(file, content)
	if err != nil {
		return false
	}

	// Strategy 1: Check for named import "dashboardBuilder"
	for imp := range parsed.ImportSpecs() {
		if imp.Name != nil && imp.Name.String() == "dashboardBuilder" {
			return true
		}
	}

	// Strategy 2: Check if filename contains "dashboard"
	if strings.Contains(strings.ToLower(filepath.Base(file)), "dashboard") {
		return true
	}

	return false
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

	logrus.Debug("🔍 Building dependency graph (including transitive dependencies)...")

	for _, dashboard := range dashboards {
		// Recursively find ALL dependencies (direct + transitive)
		allDeps := w.findAllDependencies(dashboard, make(map[string]bool))

		for libFile := range allDeps {
			w.dependencyMap[libFile] = append(w.dependencyMap[libFile], dashboard)
		}
	}

	// Log dependency map summary
	if logrus.IsLevelEnabled(logrus.DebugLevel) {
		if len(w.dependencyMap) > 0 {
			logrus.Debugf("   Found %d library file(s) with dependencies", len(w.dependencyMap))
			for libFile, dashboards := range w.dependencyMap {
				relLib, _ := filepath.Rel(w.sourceDir, libFile)
				logrus.Debugf("   - %s → %d dashboard(s)", relLib, len(dashboards))
			}
		} else {
			logrus.Debug("   No library dependencies found")
		}
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
				if (ext == ".go" || ext == ".cue") && !w.isDashboardFile(filePath) {
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
		if w.isDashboardFile(changedFile) {
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
