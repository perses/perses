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

// Package secretfile ensures that the files referenced by a Secret / GlobalSecret
// (passwordFile, credentialsFile, clientSecretFile, caFile, certFile, keyFile)
// are located in a directory explicitly allowed by the Perses administrator.
// Without this check, anyone able to create a secret could make Perses read any file on the server
// (e.g. /etc/passwd, the database password file, the encryption key...) and send it to a datasource they control.
package secretfile

import (
	"fmt"
	"path/filepath"
	"strings"

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

// Validator checks that the file paths used in a secret are allowed.
type Validator struct {
	allowedDirs []string
}

func New(allowedDirs []string) *Validator {
	return &Validator{allowedDirs: allowedDirs}
}

// ValidateSpec returns an error if any file referenced in the spec is not allowed.
func (v *Validator) ValidateSpec(spec *v1.SecretSpec) error {
	if spec == nil {
		return nil
	}
	for _, p := range spec.FilePaths() {
		if err := v.validatePath(p); err != nil {
			return err
		}
	}
	return nil
}

// validatePath returns an error if the path is not located (after symlink resolution) in one of the allowed directories.
// The error message is intentionally generic to avoid leaking whether a file exists on the server.
func (v *Validator) validatePath(path string) error {
	if v == nil || len(v.allowedDirs) == 0 {
		return fmt.Errorf("file references in secrets are disabled; ask your administrator to configure security.secret_file_allowed_directories")
	}
	notAllowed := fmt.Errorf("file %q is not allowed or doesn't exist; it must be located in one of the directories listed in security.secret_file_allowed_directories", path)
	if !filepath.IsAbs(path) {
		return fmt.Errorf("file %q must be an absolute path", path)
	}
	cleaned := filepath.Clean(path)
	// First, a purely lexical check, so we don't even touch the filesystem for obviously forbidden paths.
	if !v.isInAllowedDir(cleaned, false) {
		return notAllowed
	}
	// Then resolve symlinks, so a symlink located in an allowed directory cannot point outside of it.
	resolved, err := filepath.EvalSymlinks(cleaned)
	if err != nil {
		return notAllowed
	}
	if !v.isInAllowedDir(resolved, true) {
		return notAllowed
	}
	return nil
}

func (v *Validator) isInAllowedDir(path string, resolveDir bool) bool {
	for _, dir := range v.allowedDirs {
		if isWithin(path, dir) {
			return true
		}
		if resolveDir {
			// The allowed directory itself can be a symlink (e.g. /var/run -> /run).
			if resolvedDir, err := filepath.EvalSymlinks(dir); err == nil && isWithin(path, resolvedDir) {
				return true
			}
		}
	}
	return false
}

// isWithin returns true if path is strictly inside dir.
func isWithin(path, dir string) bool {
	rel, err := filepath.Rel(dir, path)
	if err != nil {
		return false
	}
	if rel == "." || rel == ".." || filepath.IsAbs(rel) || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return false
	}
	return true
}
