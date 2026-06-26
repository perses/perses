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

package provisioning

import (
	"context"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/perses/common/async/taskhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockProvisioningService is a test double for the provisioningServiceInterface interface.
// It records how many times reload has been called.
type mockProvisioningService struct {
	count atomic.Int32
}

func (m *mockProvisioningService) reloadAllEntities(_ []string) {
	m.count.Add(1)
}

// newTaskAndWatcher builds a task and a watcher backed by the given mock,
// mirroring what New() does but without a real provisioningService.
func newTaskAndWatcher(svc provisioningServiceInterface, folders []string) (*provisioningTask, *provisioningWatcher) {
	return &provisioningTask{svc: svc, folders: folders},
		&provisioningWatcher{svc: svc, folders: folders}
}

// runBoth launches task + watcher exactly like core.go:
//
//	runner.WithTimerTasks(interval, provisioningTask)  → taskhelper.NewTick
//	runner.WithTasks(provisioningWatcher)              → taskhelper.New
//
// The task is given a 1-hour tick so it fires exactly once at startup.
func runBoth(t *testing.T, task *provisioningTask, watcher *provisioningWatcher) (context.CancelFunc, []taskhelper.Helper) {
	t.Helper()
	taskHelper, err := taskhelper.NewTick(task, time.Hour)
	require.NoError(t, err)
	watcherHelper, err := taskhelper.New(watcher)
	require.NoError(t, err)

	ctx, cancel := context.WithCancel(context.Background())
	taskhelper.Run(ctx, cancel, taskHelper)
	taskhelper.Run(ctx, cancel, watcherHelper)
	return cancel, []taskhelper.Helper{taskHelper, watcherHelper}
}

// TestNoDoubleReloadOnStart verifies that when both task and watcher start
// (as core.go does), reload is called exactly once — by the task —
// and NOT a second time by the watcher.
func TestNoDoubleReloadOnStart(t *testing.T) {
	dir := t.TempDir()
	svc := &mockProvisioningService{}
	task, watcher := newTaskAndWatcher(svc, []string{dir})

	cancel, helpers := runBoth(t, task, watcher)

	// Give the task time to finish its first Execute and the watcher time to
	// register its fs watchers. watchDebounce is 200 ms, so any spurious watcher
	// reload would appear within this window.
	time.Sleep(500 * time.Millisecond)

	cancel()
	taskhelper.WaitAll(2*time.Second, helpers)

	assert.Equal(t, int32(1), svc.count.Load(),
		"reload must be called exactly once on startup (task only, not watcher)")
}

// TestReloadOnFileChange verifies that after startup the watcher detects a
// new file in the provisioning directory and triggers one additional reload.
func TestReloadOnFileChange(t *testing.T) {
	dir := t.TempDir()
	svc := &mockProvisioningService{}
	task, watcher := newTaskAndWatcher(svc, []string{dir})

	cancel, helpers := runBoth(t, task, watcher)
	defer func() {
		cancel()
		taskhelper.WaitAll(2*time.Second, helpers)
	}()

	// Wait for the initial task reload to settle.
	time.Sleep(300 * time.Millisecond)
	assert.Equal(t, int32(1), svc.count.Load(), "expected exactly 1 reload after startup")

	// Drop a new file to trigger the watcher.
	require.NoError(t, os.WriteFile(filepath.Join(dir, "new.yaml"), []byte("kind: Project\nmetadata:\n  name: x\n"), 0600))

	// Wait for debounce (200 ms) + buffer.
	time.Sleep(500 * time.Millisecond)

	assert.Equal(t, int32(2), svc.count.Load(),
		"watcher must trigger exactly one additional reload after a file is added")
}
