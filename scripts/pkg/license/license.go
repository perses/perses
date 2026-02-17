// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
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
	"regexp"
	"strings"

	"github.com/perses/common/set"
	"github.com/sirupsen/logrus"
)

const (
	licenseCopyright = "The Perses Authors"
	licenseHeader    = `// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.`
)

var licenseCopyrightWithDate = regexp.MustCompile(`Copyright \d{4} The Perses Authors`)

// DefaultLicense returns a License struct with default excluded directories and file patterns that matches most common use cases in the Perses project.
func DefaultLicense() License {
	return New().
		AddExcludedDir(
			"node_modules",
			".git",
			".github",
			".idea",
			"dist",
			"cue.mod",
		).
		AddPattern(
			"*.go",
			"*.cue",
			"*.js",
			"*.ts",
			"*.jsx",
			"*.tsx",
		)
}

func New() License {
	return &license{
		excludedFiles:    set.New[string](),
		excludedPatterns: set.New[string](),
		excludedDirs:     set.New[string](),
		patterns:         set.New[string](),
	}
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
	excludedFiles    set.Set[string]
	excludedPatterns set.Set[string]
	excludedDirs     set.Set[string]
	patterns         set.Set[string]
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

// collectFiles walks through the file tree starting from rootPath and collects files that match the included patterns and do not match the excluded patterns, files, or directories.
// It returns a list of files that do not contain the license header and a list of files that contains the license header with a date (e.g. "Copyright 2024 The Perses Authors").
// The second list is used to collect the files that are not compliant with the expected license header format.
func (l *license) collectFiles(rootPath string) ([]string, []string) {
	var filesNotContainingLicense []string
	var filesContainingLicenseWithDate []string
	err := filepath.WalkDir(rootPath, func(path string, info fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			for excludedDir := range l.excludedDirs {
				if info.Name() == excludedDir {
					return filepath.SkipDir
				}
			}
			return nil
		}
		for excludedFile := range l.excludedFiles {
			if info.Name() == excludedFile {
				return nil
			}
		}
		for excludedPattern := range l.excludedPatterns {
			matched, matchErr := filepath.Match(excludedPattern, info.Name())
			if matchErr != nil {
				logrus.Fatalf("Failed to match excluded pattern %q: %s", excludedPattern, matchErr)
			}
			if matched {
				return nil
			}
		}
		for pattern := range l.patterns {
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
				if scanner.Scan() {
					line := scanner.Text()
					if licenseCopyrightWithDate.MatchString(line) {
						filesContainingLicenseWithDate = append(filesContainingLicenseWithDate, path)
					} else if !strings.Contains(line, licenseCopyright) {
						filesNotContainingLicense = append(filesNotContainingLicense, path)
					}
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
	return filesNotContainingLicense, filesContainingLicenseWithDate
}

func (l *license) check() {
	filesNotContainingLicense, filesContainingLicenseWithDate := l.collectFiles(".")
	if len(filesNotContainingLicense) == 0 && len(filesContainingLicenseWithDate) == 0 {
		fmt.Println("All files contain the license header and are compliant with the expected format.")
		return
	}
	if len(filesNotContainingLicense) > 0 {
		fmt.Println("Files not containing license header:")
		for _, file := range filesNotContainingLicense {
			fmt.Println(file)
		}
	}

	if len(filesContainingLicenseWithDate) > 0 {
		fmt.Println("Files containing license header with date:")
		for _, file := range filesContainingLicenseWithDate {
			fmt.Println(file)
		}
	}

	logrus.Fatal("License header missing in some files or some files contain a date in the license header, which is not compliant with the expected format.")
}

func (l *license) fix() {
	filesNotContainingLicense, filesContainingLicenseWithDate := l.collectFiles(".")
	l.fixFiles(filesNotContainingLicense, licenseHeader+"\n\n", 0)
	l.fixFiles(filesContainingLicenseWithDate, "// Copyright The Perses Authors\n", 1)
}

func (l *license) fixFiles(files []string, header string, numberOfLinesToSkip int) {
	for _, file := range files {
		err := l.openFile(file, func(f *os.File) error {
			dir := filepath.Dir(file)
			tmpFile, err := os.CreateTemp(dir, "license_fix_*.tmp")
			if err != nil {
				logrus.Fatalf("Failed to create temp file for %q: %s", file, err)
			}
			defer tmpFile.Close() // nolint:errcheck
			// Write the license header to the temp file
			if _, writeErr := tmpFile.WriteString(header); writeErr != nil {
				logrus.Fatalf("Failed to write license header to temp file for %q: %s", file, writeErr)
			}
			// Copy the original file content to the temp file
			scanner := bufio.NewScanner(f)
			// Skip the specified number of lines in the original file
			for i := 0; i < numberOfLinesToSkip && scanner.Scan(); i++ {
				// Do nothing, just skip the line
			}
			for scanner.Scan() {
				// Write the remaining lines to the temp file
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
	l.excludedFiles.Add(files...)
	return l
}

func (l *license) AddExcludedDir(dirs ...string) License {
	l.excludedDirs.Add(dirs...)
	return l
}

func (l *license) AddExcludedPattern(patterns ...string) License {
	l.excludedPatterns.Add(patterns...)
	return l
}

func (l *license) AddPattern(patterns ...string) License {
	l.patterns.Add(patterns...)
	return l
}
