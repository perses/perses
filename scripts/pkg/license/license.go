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

type License struct {
	ExcludedFiles    []string
	ExcludedPatterns []string
	ExcludedDirs     []string
	Patterns         []string
	checkLicenseFlag bool
	fixLicenseFlag   bool
}

func (l *License) openFile(path string, do func(f *os.File) error) error {
	f, err := os.Open(path) // nolint:gosec
	if err != nil {
		return err
	}
	defer f.Close() // nolint:errcheck
	return do(f)
}

func (l *License) collectFilesNotContainingLicense(rootPath string) []string {
	var filesNotContainingLicense []string
	err := filepath.WalkDir(rootPath, func(path string, info fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			for _, excludedDir := range l.ExcludedDirs {
				if info.Name() == excludedDir {
					return filepath.SkipDir
				}
			}
			return nil
		}
		for _, excludedFile := range l.ExcludedFiles {
			if info.Name() == excludedFile {
				return nil
			}
		}
		for _, excludedPattern := range l.ExcludedPatterns {
			matched, matchErr := filepath.Match(excludedPattern, info.Name())
			if matchErr != nil {
				logrus.Fatalf("Failed to match excluded pattern %q: %s", excludedPattern, matchErr)
			}
			if matched {
				return nil
			}
		}
		for _, pattern := range l.Patterns {
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

func (l *License) check() {
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

func (l *License) fix() {
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

func (l *License) RegisterFlags() {
	flag.BoolVar(&l.checkLicenseFlag, "check", false, "Check if all files contain the license header")
	flag.BoolVar(&l.fixLicenseFlag, "fix", false, "Fix files to add the license header where missing")
}

func (l *License) Execute() {
	if l.checkLicenseFlag {
		l.check()
	}
	if l.fixLicenseFlag {
		l.fix()
	}
}
