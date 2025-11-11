// Copyright 2025 The Perses Authors
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

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/sirupsen/logrus"
)

// This script goes through the CUE files and validates each of them against its
// corresponding test file, if it exists.

const (
	schemasDir = "cue"
	testDir    = "cue-test"
)

// dirsInScope specifies which subdirectories under cue/ to validate
var dirsInScope = []string{"common", "dac-utils"}

func findCueFiles(baseDir string, subDir string) ([]string, error) {
	var files []string
	dirPath := filepath.Join(baseDir, subDir)

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && filepath.Ext(path) == ".cue" {
			// Convert to relative path from baseDir
			relPath, err := filepath.Rel(baseDir, path)
			if err != nil {
				return err
			}
			files = append(files, relPath)
		}

		return nil
	})

	return files, err
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func runCueVet(schemaFile, testFile string) error {
	logrus.Debugf("Validating %s against %s", schemaFile, testFile)

	cmd := exec.Command("cue", "vet", "-c=false", schemaFile, testFile)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to validate %s: %w", schemaFile, err)
	}

	return nil
}

func validateCueFiles() error {
	logrus.Debugf("Starting CUE files validation")

	// Check if cue command is available
	if _, err := exec.LookPath("cue"); err != nil {
		return fmt.Errorf("cue command not found in PATH: %w", err)
	}

	validatedCount := 0
	skippedCount := 0

	for _, subDir := range dirsInScope {
		logrus.Debugf("Processing directory: %s", subDir)

		files, err := findCueFiles(schemasDir, subDir)
		if err != nil {
			return fmt.Errorf("failed to find CUE files in %s/%s: %w", schemasDir, subDir, err)
		}

		for _, file := range files {
			schemaFile := filepath.Join(schemasDir, file)
			testFile := filepath.Join(testDir, file)

			if !fileExists(testFile) {
				logrus.Debugf("Skipping %s: test file %s not found", schemaFile, testFile)
				skippedCount++
				continue
			}

			if err := runCueVet(schemaFile, testFile); err != nil {
				return err
			}

			validatedCount++
		}
	}

	logrus.Infof("CUE files validation completed: %d validated, %d skipped", validatedCount, skippedCount)
	return nil
}

func main() {
	if err := validateCueFiles(); err != nil {
		logrus.Fatal(err)
	}
}
