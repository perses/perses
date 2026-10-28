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

package config

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
)

// setUnwritableFilePath points Global at a config file whose parent directory
// cannot be created by os.Mkdir. os.Mkdir is non-recursive, so a path with a
// missing intermediate directory makes the mkdir call fail while os.Stat on the
// directory reports that it does not exist.
func setUnwritableFilePath(t *testing.T) {
	t.Helper()
	previous := Global
	t.Cleanup(func() {
		Global = previous
	})
	filePath := filepath.Join(t.TempDir(), "missing-parent", ".perses", "config.json")
	Global = &Config{}
	Global.SetFilePath(filePath)
}

// assertMkdirError checks that the returned error comes from the failing
// os.Mkdir call and not from the earlier os.Stat call. Both errors satisfy
// os.IsNotExist, so the operation recorded on the PathError is what
// distinguishes them.
func assertMkdirError(t *testing.T, err error) {
	t.Helper()
	var pathErr *os.PathError
	if assert.ErrorAs(t, err, &pathErr) {
		assert.Equal(t, "mkdir", pathErr.Op)
	}
}

func TestWriteReturnsMkdirError(t *testing.T) {
	setUnwritableFilePath(t)
	err := Write(&Config{})
	assert.Error(t, err)
	assertMkdirError(t, err)
}

func TestWriteFromScratchReturnsMkdirError(t *testing.T) {
	setUnwritableFilePath(t)
	err := WriteFromScratch(&Config{})
	assert.Error(t, err)
	assertMkdirError(t, err)
}

// setWritableFilePath points Global at a config file in a fresh temporary
// directory so that Write can create it.
func setWritableFilePath(t *testing.T) string {
	t.Helper()
	previous := Global
	t.Cleanup(func() {
		Global = previous
	})
	filePath := filepath.Join(t.TempDir(), "config.json")
	Global = &Config{}
	Global.SetFilePath(filePath)
	return filePath
}

func TestSetTokens(t *testing.T) {
	filePath := setWritableFilePath(t)
	assert.NoError(t, SetTokens("access", "refresh"))
	cfg, err := readConfig(filePath)
	assert.NoError(t, err)
	assert.Equal(t, secret.NewBearerToken("access"), cfg.RestClientConfig.Authorization)
	assert.Equal(t, "refresh", cfg.RefreshToken)
}

func TestSetTokensEmptyAccessToken(t *testing.T) {
	filePath := setWritableFilePath(t)
	assert.NoError(t, SetTokens("access", "refresh"))
	// the stored tokens must be left untouched when the new access token is empty
	assert.EqualError(t, SetTokens("", "new-refresh"), "unable to save the tokens: the access token is empty")
	cfg, err := readConfig(filePath)
	assert.NoError(t, err)
	assert.Equal(t, secret.NewBearerToken("access"), cfg.RestClientConfig.Authorization)
	assert.Equal(t, "refresh", cfg.RefreshToken)
}
