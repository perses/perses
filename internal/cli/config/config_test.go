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

	"github.com/sirupsen/logrus"
	"github.com/sirupsen/logrus/hooks/test"
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

// initWithLogs runs Init on the given path and returns the log entries emitted
// at the info level, so that a test can check what the user would see with the
// default log level. The standard logger is restored once the test is done.
func initWithLogs(t *testing.T, filePath string) []*logrus.Entry {
	t.Helper()
	previous := Global
	logger := logrus.StandardLogger()
	previousLevel := logger.GetLevel()
	previousHooks := logger.ReplaceHooks(make(logrus.LevelHooks))
	t.Cleanup(func() {
		logger.ReplaceHooks(previousHooks)
		logger.SetLevel(previousLevel)
		Global = previous
	})
	logger.SetLevel(logrus.InfoLevel)
	hook := test.NewLocal(logger)
	Init(filePath)
	return hook.AllEntries()
}

func TestInitWithoutConfigFile(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "config.json")
	entries := initWithLogs(t, filePath)
	assert.Empty(t, entries)
	assert.Equal(t, &Config{filePath: filePath, Dac: Dac{OutputFolder: DefaultOutputFolder}}, Global)
}

func TestInitWithUnreadableConfigFile(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "config.json")
	assert.NoError(t, os.WriteFile(filePath, []byte("{"), 0600))
	entries := initWithLogs(t, filePath)
	// the config is ignored, but the user must be told why
	if assert.Len(t, entries, 1) {
		assert.Equal(t, logrus.WarnLevel, entries[0].Level)
		assert.Contains(t, entries[0].Message, filePath)
		assert.Error(t, entries[0].Data[logrus.ErrorKey].(error))
	}
	assert.Equal(t, &Config{filePath: filePath, Dac: Dac{OutputFolder: DefaultOutputFolder}}, Global)
}

func TestReadConfigNotExist(t *testing.T) {
	_, err := readConfig(filepath.Join(t.TempDir(), "config.json"))
	assert.ErrorIs(t, err, os.ErrNotExist)
}
