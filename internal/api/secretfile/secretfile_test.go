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

package secretfile

import (
	"os"
	"path/filepath"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
)

func TestValidatePath(t *testing.T) {
	allowedDir := t.TempDir()
	outsideDir := t.TempDir()

	allowedFile := filepath.Join(allowedDir, "password")
	outsideFile := filepath.Join(outsideDir, "passwd")
	symlinkToOutside := filepath.Join(allowedDir, "evil")
	for _, f := range []string{allowedFile, outsideFile} {
		if err := os.WriteFile(f, []byte("secret"), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Symlink(outsideFile, symlinkToOutside); err != nil {
		t.Fatal(err)
	}

	testSuite := []struct {
		title       string
		allowedDirs []string
		path        string
		wantErr     bool
	}{
		{title: "no allowed dirs means file are disabled", allowedDirs: nil, path: allowedFile, wantErr: true},
		{title: "file in allowed dir", allowedDirs: []string{allowedDir}, path: allowedFile},
		{title: "file outside allowed dir", allowedDirs: []string{allowedDir}, path: outsideFile, wantErr: true},
		{title: "/etc/passwd", allowedDirs: []string{allowedDir}, path: "/etc/passwd", wantErr: true},
		{title: "relative path", allowedDirs: []string{allowedDir}, path: "password", wantErr: true},
		{title: "path traversal", allowedDirs: []string{allowedDir}, path: filepath.Join(allowedDir, "..", filepath.Base(outsideDir), "passwd"), wantErr: true},
		{title: "raw path traversal", allowedDirs: []string{allowedDir}, path: allowedDir + "/../../../../etc/passwd", wantErr: true},
		{title: "symlink escaping allowed dir", allowedDirs: []string{allowedDir}, path: symlinkToOutside, wantErr: true},
		{title: "allowed dir itself", allowedDirs: []string{allowedDir}, path: allowedDir, wantErr: true},
		{title: "prefix sibling dir", allowedDirs: []string{allowedDir}, path: allowedDir + "-other/password", wantErr: true},
		{title: "non existing file", allowedDirs: []string{allowedDir}, path: filepath.Join(allowedDir, "nope"), wantErr: true},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := New(test.allowedDirs).validatePath(test.path)
			if test.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateSpec(t *testing.T) {
	allowedDir := t.TempDir()
	v := New([]string{allowedDir})

	testSuite := []struct {
		title   string
		spec    *v1.SecretSpec
		wantErr bool
	}{
		{
			title: "nil spec",
			spec:  nil,
		},
		{
			title: "basicAuth with inline password",
			spec:  &v1.SecretSpec{BasicAuth: &secret.BasicAuth{Username: "foo", Password: "bar"}},
		},
		{
			title:   "basicAuth passwordFile outside allowed dir",
			spec:    &v1.SecretSpec{BasicAuth: &secret.BasicAuth{Username: "foo", PasswordFile: "/etc/passwd"}},
			wantErr: true,
		},
		{
			title:   "authorization credentialsFile outside allowed dir",
			spec:    &v1.SecretSpec{Authorization: &secret.Authorization{CredentialsFile: "/etc/passwd"}},
			wantErr: true,
		},
		{
			title:   "oauth clientSecretFile outside allowed dir",
			spec:    &v1.SecretSpec{OAuth: &secret.OAuth{ClientSecretFile: "/etc/passwd"}},
			wantErr: true,
		},
		{
			title:   "tlsConfig caFile outside allowed dir",
			spec:    &v1.SecretSpec{TLSConfig: &secret.TLSConfig{CAFile: "/etc/passwd"}},
			wantErr: true,
		},
		{
			title:   "tlsConfig certFile outside allowed dir",
			spec:    &v1.SecretSpec{TLSConfig: &secret.TLSConfig{CertFile: "/etc/passwd"}},
			wantErr: true,
		},
		{
			title:   "tlsConfig keyFile outside allowed dir",
			spec:    &v1.SecretSpec{TLSConfig: &secret.TLSConfig{KeyFile: "/etc/passwd"}},
			wantErr: true,
		},
	}
	for _, test := range testSuite {
		t.Run(test.title, func(t *testing.T) {
			err := v.ValidateSpec(test.spec)
			if test.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
