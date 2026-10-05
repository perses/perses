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

package native

import (
	"sync"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/user"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// pausingContext wraps an echo.Context and blocks the first call to Get until resume is closed.
// It is used to deterministically pause a request in the middle of the authorization code.
type pausingContext struct {
	echo.Context
	once   sync.Once
	paused chan struct{}
	resume chan struct{}
}

func (c *pausingContext) Get(key string) any {
	c.once.Do(func() {
		close(c.paused)
		<-c.resume
	})
	return c.Context.Get(key)
}

// pausingUserDAO is a fake user DAO whose next List call can be paused, to simulate a slow cache refresh.
// The users returned are the ones defined when List is called, i.e. before the pause.
type pausingUserDAO struct {
	user.DAO
	mutex  sync.Mutex
	items  []*v1.User
	paused chan struct{}
	resume chan struct{}
}

func (d *pausingUserDAO) List(_ *user.Query) ([]*v1.User, error) {
	d.mutex.Lock()
	items, paused, resume := d.items, d.paused, d.resume
	d.paused, d.resume = nil, nil
	d.mutex.Unlock()
	if paused != nil {
		close(paused)
		<-resume
	}
	return items, nil
}

func (d *pausingUserDAO) setItems(items []*v1.User) {
	d.mutex.Lock()
	defer d.mutex.Unlock()
	d.items = items
}

// pauseNextList makes the next List call block until resume is closed. paused is closed once the call is blocked.
func (d *pausingUserDAO) pauseNextList() (paused chan struct{}, resume chan struct{}) {
	d.mutex.Lock()
	defer d.mutex.Unlock()
	d.paused, d.resume = make(chan struct{}), make(chan struct{})
	return d.paused, d.resume
}

// isHasPermissionBlocked returns true if an unrelated HasPermission call doesn't complete in a reasonable time.
func isHasPermissionBlocked(n *native) bool {
	done := make(chan struct{})
	go func() {
		n.HasPermission(newTestContext(testUserName(0), nil), v1Role.ReadAction, testProjectName(0), v1Role.DashboardScope)
		close(done)
	}()
	select {
	case <-done:
		return false
	case <-time.After(200 * time.Millisecond):
		return true
	}
}

// TestGetPermissionsWithConcurrentRefreshDoesNotDeadlock is a regression test for a deadlock that occurred when the
// cache was protected by a sync.RWMutex, with the following interleaving:
//  1. a request calls GetPermissions, which acquired the read lock,
//  2. a cache refresh called Lock() and waited for the read lock to be released,
//  3. GetPermissions called claimPermissions, which acquired the read lock a second time.
//
// As stated in the sync.RWMutex documentation, a blocked Lock call excludes new readers from acquiring the lock,
// so recursive read locking is prohibited: step 3 waited for step 2, which waited for step 1 to release its lock.
// Every other request then blocked on the read lock too.
//
// The test does not rely on the internal synchronization implementation: if the refresh is not blocked by the paused
// request, it simply completes and the test passes. If it is blocked, both calls must still complete once the
// request is resumed.
func TestGetPermissionsWithConcurrentRefreshDoesNotDeadlock(t *testing.T) {
	ds := newTestDataset(datasetSizes[0])
	n := ds.newNative(t, true)

	// The user must have persisted claims matching a mapping: otherwise, claimPermissions returns before accessing
	// the cache, and the code path that used to deadlock is not exercised.
	ctx := &pausingContext{
		Context: newTestContext(testClaimUser, map[string][]string{testClaimName: {testTeamClaim(0)}}),
		paused:  make(chan struct{}),
		resume:  make(chan struct{}),
	}

	// 1. Start the request and wait for it to be paused inside GetPermissions.
	getPermissionsDone := make(chan error, 1)
	go func() {
		_, err := n.GetPermissions(ctx)
		getPermissionsDone <- err
	}()
	<-ctx.paused

	// 2. Start a cache refresh while the request is paused, and give it the time to either complete
	// or block on the write lock.
	refreshDone := make(chan error, 1)
	go func() { refreshDone <- n.RefreshPermissionsAndRoles() }()
	refreshFinished := false
	select {
	case err := <-refreshDone:
		require.NoError(t, err)
		refreshFinished = true
	case <-time.After(100 * time.Millisecond):
	}

	// 3. Resume the request: both the request and the refresh must complete.
	close(ctx.resume)
	deadline := time.After(5 * time.Second)
	select {
	case err := <-getPermissionsDone:
		require.NoError(t, err)
	case <-deadline:
		t.Fatalf("deadlock: GetPermissions never returned while a cache refresh was pending (unrelated HasPermission calls blocked too: %t)", isHasPermissionBlocked(n))
	}
	if !refreshFinished {
		select {
		case err := <-refreshDone:
			require.NoError(t, err)
		case <-deadline:
			t.Fatal("deadlock: RefreshPermissionsAndRoles never returned")
		}
	}
}

// TestConcurrentRefreshesAreNotSerializedAndOrdered checks that:
//   - a refresh doesn't wait for another refresh in progress. The refreshes are called synchronously by the API
//     handlers (e.g. at the first login of an OAuth/OIDC user): serializing them would make the callers queue up.
//   - the cache built by a slow refresh never replaces the cache built by a refresh that started after it,
//     and that might include more recent changes.
func TestConcurrentRefreshesAreNotSerializedAndOrdered(t *testing.T) {
	ds := newTestDataset(datasetSizes[0])
	// user0, bound to the "admin" GlobalRole, is not created yet.
	userDAO := &pausingUserDAO{items: ds.users[1:]}
	n := &native{
		userDAO:              userDAO,
		roleDAO:              &fakeRoleDAO{items: ds.roles},
		roleBindingDAO:       &fakeRoleBindingDAO{items: ds.roleBindings},
		globalRoleDAO:        &fakeGlobalRoleDAO{items: ds.globalRoles},
		globalRoleBindingDAO: &fakeGlobalRoleBindingDAO{items: ds.globalRoleBindings},
	}
	require.NoError(t, n.RefreshPermissionsAndRoles())
	adminCtx := newTestContext(testUserName(0), nil)
	isAdmin := func() bool {
		return n.HasPermission(adminCtx, v1Role.UpdateAction, testProjectName(0), v1Role.DashboardScope)
	}
	require.False(t, isAdmin())

	// 1. A slow refresh starts: it lists the users before user0 is created, then is paused.
	paused, resume := userDAO.pauseNextList()
	slowRefreshDone := make(chan error, 1)
	go func() { slowRefreshDone <- n.RefreshPermissionsAndRoles() }()
	<-paused

	// 2. user0 is created, which triggers another refresh: it must not wait for the slow one.
	userDAO.setItems(ds.users)
	refreshDone := make(chan error, 1)
	go func() { refreshDone <- n.RefreshPermissionsAndRoles() }()
	select {
	case err := <-refreshDone:
		require.NoError(t, err)
	case <-time.After(5 * time.Second):
		close(resume)
		t.Fatal("a refresh waited for another refresh in progress")
	}
	assert.True(t, isAdmin(), "the cache built by the most recent refresh should be published")

	// 3. The slow refresh completes: its outdated cache must not replace the most recent one.
	close(resume)
	select {
	case err := <-slowRefreshDone:
		require.NoError(t, err)
	case <-time.After(5 * time.Second):
		t.Fatal("the slow refresh never returned")
	}
	assert.True(t, isAdmin(), "the outdated cache built by the slow refresh replaced the most recent one")
}

// TestGetPermissionsIsolatedBetweenUsers checks that the result of GetPermissions for a user is not altered
// by a later call for another user. The guest permissions come from the config and their slice can have a
// capacity greater than its length: appending to it must not write into its (shared) backing array.
func TestGetPermissionsIsolatedBetweenUsers(t *testing.T) {
	ds := newTestDataset(datasetSizes[0])
	n := ds.newNative(t, false)
	// The guest permissions slice has a length of 1 but a capacity of 4: it shares its backing array.
	backingArray := make([]*v1Role.Permission, 4)
	backingArray[0] = &v1Role.Permission{
		Actions: []v1Role.Action{v1Role.ReadAction},
		Scopes:  []v1Role.Scope{v1Role.GlobalDatasourceScope},
	}
	n.guestPermissions = backingArray[:1]

	// user0 is bound to the "admin" GlobalRole.
	adminPermissions, err := n.GetPermissions(newTestContext(testUserName(0), nil))
	require.NoError(t, err)
	require.Len(t, adminPermissions[v1.WildcardProject], 2)
	require.Equal(t, testWildcardPermission, *adminPermissions[v1.WildcardProject][1])

	// user50 is bound to the "global-viewer" GlobalRole.
	_, err = n.GetPermissions(newTestContext(testUserName(50), nil))
	require.NoError(t, err)

	assert.Equal(t, testWildcardPermission, *adminPermissions[v1.WildcardProject][1], "the permissions of user0 have been overwritten by the ones of user50")
	assert.Nil(t, backingArray[1], "the backing array of the guest permissions has been modified")
}

// TestConcurrentAccessWithRefresh exercises all the read paths concurrently with cache refreshes.
// It checks that the requests are always granted, i.e. that a request never sees an empty or partially built cache
// during a refresh, and that they never block. When run with the race detector (go test -race), it also detects
// the data races between the requests and the refreshes.
func TestConcurrentAccessWithRefresh(t *testing.T) {
	silenceTestLogs(t)
	size := datasetSizes[0]
	ds := newTestDataset(size)
	n := ds.newNative(t, true)
	n.guestPermissions = make([]*v1Role.Permission, 1, 4)
	n.guestPermissions[0] = &v1Role.Permission{
		Actions: []v1Role.Action{v1Role.ReadAction},
		Scopes:  []v1Role.Scope{v1Role.GlobalDatasourceScope},
	}

	// Each request is expected to be granted, whatever the cache snapshot used.
	requests := []struct {
		ctx     echo.Context
		project string
	}{
		{ctx: newTestContext(testUserName(0), nil), project: testProjectName(0)},                                                     // global admin
		{ctx: newTestContext(testUserName(1), nil), project: testProjectName(size.memberProject(1, 0))},                              // project member
		{ctx: newTestContext(testUserName(50), nil), project: testProjectName(0)},                                                    // global viewer
		{ctx: newTestContext(testClaimUser, map[string][]string{testClaimName: {testAdminClaimValue}}), project: testProjectName(0)}, // claims
	}

	const iterations = 200
	var wg sync.WaitGroup
	wg.Go(func() {
		for range 20 {
			assert.NoError(t, n.RefreshPermissionsAndRoles())
		}
	})
	for _, req := range requests {
		wg.Go(func() {
			for range iterations {
				assert.True(t, n.HasPermission(req.ctx, v1Role.ReadAction, req.project, v1Role.DashboardScope))
				projects, err := n.GetUserProjects(req.ctx, v1Role.ReadAction, v1Role.DashboardScope)
				assert.NoError(t, err)
				assert.NotEmpty(t, projects)
				permissions, err := n.GetPermissions(req.ctx)
				assert.NoError(t, err)
				assert.NotEmpty(t, permissions)
			}
		})
	}

	// Fail fast instead of waiting for the global test timeout if the requests or the refreshes are blocked.
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(30 * time.Second):
		t.Fatal("the concurrent requests and refreshes did not complete: they are probably blocked")
	}
}
