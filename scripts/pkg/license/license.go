// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package license

import (
	"bufio"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/sirupsen/logrus"
)

const (
	licenseCopyright = "The Perses Authors"
	licenseHeader    = `// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.`
)

// DefaultLicense returns a License struct with default excluded directories and file patterns that matches most common use cases in the Perses project.
func DefaultLicense() License {
	return &license{
		excludedDirs: []string{
			"node_modules",
			".git",
			".github",
			".idea",
			"dist",
			"cue.mod",
		},
		patterns: []string{
			"*.go",
			"*.cue",
			"*.js",
			"*.ts",
			"*.jsx",
			"*.tsx",
		},
	}
}

func New() License {
	return &license{}
}

type License interface {
	// AddExcludedFile adds files to be excluded from license checking.
	// Adding the same file multiple times has no effect.
	AddExcludedFile(files ...string) License
	// AddExcludedDir adds directories to be excluded from license checking.
	// Adding the same directory multiple times has no effect.
	AddExcludedDir(dirs ...string) License
	// AddExcludedPattern adds file patterns to be excluded from license checking.
	// Adding the same pattern multiple times has no effect.
	AddExcludedPattern(patterns ...string) License
	// AddPattern adds file patterns to be included in license checking.
	// Adding the same pattern multiple times has no effect.
	AddPattern(patterns ...string) License
	// RegisterFlags registers command-line flags for license checking.
	// This is mandatory to call this method before calling Execute.
	RegisterFlags()
	// Execute performs the license checking or fixing based on the registered flags.
	Execute()
}

type license struct {
	excludedFiles    []string
	excludedPatterns []string
	excludedDirs     []string
	patterns         []string
	checkLicenseFlag bool
	fixLicenseFlag   bool
}

func (l *license) openFile(path string, do func(f *os.File) error) error {
	f, err := os.Open(path) // nolint:gosec
	if err != nil {
		return err
	}
	defer f.Close() // nolint:errcheck
	return do(f)
}

func (l *license) collectFilesNotContainingLicense(rootPath string) []string {
	var filesNotContainingLicense []string
	err := filepath.WalkDir(rootPath, func(path string, info fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			for _, excludedDir := range l.excludedDirs {
				if info.Name() == excludedDir {
					return filepath.SkipDir
				}
			}
			return nil
		}
		for _, excludedFile := range l.excludedFiles {
			if info.Name() == excludedFile {
				return nil
			}
		}
		for _, excludedPattern := range l.excludedPatterns {
			matched, matchErr := filepath.Match(excludedPattern, info.Name())
			if matchErr != nil {
				logrus.Fatalf("Failed to match excluded pattern %q: %s", excludedPattern, matchErr)
			}
			if matched {
				return nil
			}
		}
		for _, pattern := range l.patterns {
			matched, matchErr := filepath.Match(pattern, info.Name())
			if matchErr != nil {
				logrus.Fatalf("Failed to match pattern %q: %s", pattern, matchErr)
			}
			if !matched {
				continue
			}
			// We want to read the first line of the file to check the license. We don't need to read the entire file.
			// The license header must be at the top of the file.
			openErr := l.openFile(path, func(f *os.File) error {
				scanner := bufio.NewScanner(f)
				if scanner.Scan() && !strings.Contains(scanner.Text(), licenseCopyright) {
					filesNotContainingLicense = append(filesNotContainingLicense, path)
				}
				return nil
			})
			if openErr != nil {
				logrus.Fatalf("Failed to open file %q: %s", path, openErr)
			}
		}
		return nil
	})
	if err != nil {
		logrus.Fatal(err)
	}
	return filesNotContainingLicense
}

func (l *license) check() {
	filesNotContainingLicense := l.collectFilesNotContainingLicense(".")
	if len(filesNotContainingLicense) == 0 {
		fmt.Println("All files contain the license header.")
		return
	}
	fmt.Println("Files not containing license header:")
	for _, file := range filesNotContainingLicense {
		fmt.Println(file)
	}
	logrus.Fatal("License header missing in some files")
}

func (l *license) fix() {
	filesNotContainingLicense := l.collectFilesNotContainingLicense(".")
	for _, file := range filesNotContainingLicense {
		err := l.openFile(file, func(f *os.File) error {
			dir := filepath.Dir(file)
			tmpFile, err := os.CreateTemp(dir, "license_fix_*.tmp")
			if err != nil {
				logrus.Fatalf("Failed to create temp file for %q: %s", file, err)
			}
			defer tmpFile.Close() // nolint:errcheck
			// Write the license header to the temp file
			if _, writeErr := tmpFile.WriteString(licenseHeader + "\n\n"); writeErr != nil {
				logrus.Fatalf("Failed to write license header to temp file for %q: %s", file, writeErr)
			}
			// Copy the original file content to the temp file
			scanner := bufio.NewScanner(f)
			for scanner.Scan() {
				if _, writeErr := tmpFile.WriteString(scanner.Text() + "\n"); writeErr != nil {
					logrus.Fatalf("Failed to write content to temp file for %q: %s", file, writeErr)
				}
			}
			if scanErr := scanner.Err(); scanErr != nil {
				logrus.Fatalf("Failed to read original file %q: %s", file, scanErr)
			}
			// Replace the original file with the temp file
			if renameErr := os.Rename(tmpFile.Name(), file); renameErr != nil {
				logrus.Fatalf("Failed to replace original file %q with temp file: %s", file, renameErr)
			}
			return nil
		})
		if err != nil {
			logrus.Fatalf("Failed to open file %q: %s", file, err)
		}
	}
}

func (l *license) RegisterFlags() {
	flag.BoolVar(&l.checkLicenseFlag, "check", false, "Check if all files contain the license header")
	flag.BoolVar(&l.fixLicenseFlag, "fix", false, "Fix files to add the license header where missing")
}

func (l *license) Execute() {
	if l.checkLicenseFlag {
		l.check()
	}
	if l.fixLicenseFlag {
		l.fix()
	}
}

func (l *license) AddExcludedFile(files ...string) License {
	for _, file := range files {
		if !slices.Contains(l.excludedFiles, file) {
			l.excludedFiles = append(l.excludedFiles, file)
		}
	}
	return l
}

func (l *license) AddExcludedDir(dirs ...string) License {
	for _, dir := range dirs {
		if !slices.Contains(l.excludedDirs, dir) {
			l.excludedDirs = append(l.excludedDirs, dir)
		}
	}
	return l
}

func (l *license) AddExcludedPattern(patterns ...string) License {
	for _, pattern := range patterns {
		if !slices.Contains(l.excludedPatterns, pattern) {
			l.excludedPatterns = append(l.excludedPatterns, pattern)
		}
	}
	return l
}

func (l *license) AddPattern(patterns ...string) License {
	for _, pattern := range patterns {
		if !slices.Contains(l.patterns, pattern) {
			l.patterns = append(l.patterns, pattern)
		}
	}
	return l
}
