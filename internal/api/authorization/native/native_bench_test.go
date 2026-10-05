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
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

// This file contains benchmarks for the native authorization system, based on the datasets of fixtures_test.go.
// They cover:
//   - the cache (re)build from the database (RefreshPermissionsAndRoles), with one or several concurrent callers,
//   - the request-time permission checks (HasPermission, GetUserProjects, GetPermissions),
//   - the claim-based permission resolution (claimPermissions),
//   - the core matching function (listHasPermission),
//   - the behavior under concurrent access (with and without concurrent cache refresh).
//
// Run them with:
//   go test -run '^$' -bench . -benchmem ./internal/api/authorization/native/

// maxRefreshDurationForConcurrentBench is the maximum duration of a cache refresh for the "concurrent-refresh"
// benchmark to be meaningful: beyond, no new cache would be published during the measurement.
const maxRefreshDurationForConcurrentBench = 100 * time.Millisecond

// sink used to prevent the compiler from optimizing away the benchmarked calls in RunParallel.
var benchBoolSink atomic.Bool

// BenchmarkRefreshPermissionsAndRoles measures the time needed to (re)build the whole permission cache
// from the database content. This is executed at startup and periodically by the refresh cron.
func BenchmarkRefreshPermissionsAndRoles(b *testing.B) {
	silenceTestLogs(b)
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, false)
		b.Run(size.String(), func(b *testing.B) {
			b.ReportAllocs()
			for b.Loop() {
				if err := n.RefreshPermissionsAndRoles(); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

// BenchmarkConcurrentRefreshPermissionsAndRoles simulates 25 OAuth/OIDC users logging in for the first time at the same
// time: each first login creates the user, then refreshes the whole permission cache synchronously, before answering.
// The time per operation is the time until all the refreshes are done, i.e. the wait of the slowest login.
// A refresh must not wait for the other ones in progress: if the refreshes were serialized, this time would be
// 25 times the time of a single refresh (see BenchmarkRefreshPermissionsAndRoles).
// The creation of the 25 users is not simulated: it doesn't change significantly the cost of a refresh.
func BenchmarkConcurrentRefreshPermissionsAndRoles(b *testing.B) {
	silenceTestLogs(b)
	const callers = 25
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, false)
		b.Run(fmt.Sprintf("%s,callers=%d", size, callers), func(b *testing.B) {
			for b.Loop() {
				var wg sync.WaitGroup
				for range callers {
					wg.Go(func() {
						if err := n.RefreshPermissionsAndRoles(); err != nil {
							b.Error(err)
						}
					})
				}
				wg.Wait()
			}
		})
	}
}

type benchPermissionRequest struct {
	name     string
	ctx      echo.Context
	action   v1Role.Action
	project  string
	scope    v1Role.Scope
	expected bool
}

func (ds *testDataset) benchPermissionRequests() []benchPermissionRequest {
	size := ds.size
	lastProject := testProjectName(size.projectCount - 1)
	memberUser := 1
	memberProject := testProjectName(size.memberProject(memberUser, size.projectsPerUser-1))
	nonMemberProject := testProjectName(size.nonMemberProject(memberUser))
	return []benchPermissionRequest{
		{
			name:     "global-admin",
			ctx:      newTestContext(testUserName(0), nil),
			action:   v1Role.UpdateAction,
			project:  lastProject,
			scope:    v1Role.DashboardScope,
			expected: true,
		},
		{
			name:     "global-admin/global-resource",
			ctx:      newTestContext(testUserName(0), nil),
			action:   v1Role.CreateAction,
			project:  v1.WildcardProject,
			scope:    v1Role.GlobalDatasourceScope,
			expected: true,
		},
		{
			name:     "global-viewer/read",
			ctx:      newTestContext(testUserName(50), nil),
			action:   v1Role.ReadAction,
			project:  lastProject,
			scope:    v1Role.DashboardScope,
			expected: true,
		},
		{
			name:     "project-member/allowed",
			ctx:      newTestContext(testUserName(memberUser), nil),
			action:   v1Role.ReadAction,
			project:  memberProject,
			scope:    v1Role.DashboardScope,
			expected: true,
		},
		{
			name:     "project-member/denied-other-project",
			ctx:      newTestContext(testUserName(memberUser), nil),
			action:   v1Role.ReadAction,
			project:  nonMemberProject,
			scope:    v1Role.DashboardScope,
			expected: false,
		},
		{
			name:     "project-member/denied-global-resource",
			ctx:      newTestContext(testUserName(memberUser), nil),
			action:   v1Role.CreateAction,
			project:  v1.WildcardProject,
			scope:    v1Role.GlobalRoleScope,
			expected: false,
		},
		{
			name:     "unknown-user",
			ctx:      newTestContext(testUnknownUser, nil),
			action:   v1Role.ReadAction,
			project:  memberProject,
			scope:    v1Role.DashboardScope,
			expected: false,
		},
		{
			// Worst case for the claim resolution: the matching role is the last one of the cache.
			name:     "claims/project-role",
			ctx:      newTestContext(testClaimUser, map[string][]string{testClaimName: {testTeamClaim(size.projectCount - 1)}}),
			action:   v1Role.UpdateAction,
			project:  lastProject,
			scope:    v1Role.DashboardScope,
			expected: true,
		},
		{
			name:     "claims/global-role",
			ctx:      newTestContext(testClaimUser, map[string][]string{testClaimName: {testAdminClaimValue}}),
			action:   v1Role.DeleteAction,
			project:  lastProject,
			scope:    v1Role.ProjectScope,
			expected: true,
		},
		{
			name:     "claims/denied",
			ctx:      newTestContext(testClaimUser, map[string][]string{testClaimName: {testTeamClaim(0)}}),
			action:   v1Role.UpdateAction,
			project:  lastProject,
			scope:    v1Role.DashboardScope,
			expected: false,
		},
	}
}

// BenchmarkNativeHasPermission measures the full HasPermission path executed on every authorized request:
// context extraction, guest permissions, claim-based permissions and cached permissions.
func BenchmarkNativeHasPermission(b *testing.B) {
	silenceTestLogs(b)
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, true)
		for _, req := range ds.benchPermissionRequests() {
			b.Run(fmt.Sprintf("%s/%s", size, req.name), func(b *testing.B) {
				if got := n.HasPermission(req.ctx, req.action, req.project, req.scope); got != req.expected {
					b.Fatalf("unexpected HasPermission result: got %t, expected %t", got, req.expected)
				}
				b.ReportAllocs()
				for b.Loop() {
					n.HasPermission(req.ctx, req.action, req.project, req.scope)
				}
			})
		}
	}
}

// BenchmarkNativeHasPermissionWithGuestPermissions measures HasPermission when the request is
// satisfied by the guest permissions (short-circuit before any cache lookup).
func BenchmarkNativeHasPermissionWithGuestPermissions(b *testing.B) {
	ds := newTestDataset(datasetSizes[1])
	n := ds.newNative(b, false)
	n.guestPermissions = []*v1Role.Permission{
		{Actions: []v1Role.Action{v1Role.ReadAction}, Scopes: []v1Role.Scope{v1Role.GlobalDatasourceScope, v1Role.GlobalVariableScope}},
		{Actions: []v1Role.Action{v1Role.CreateAction}, Scopes: []v1Role.Scope{v1Role.ProjectScope}},
	}
	ctx := newTestContext(testUserName(1), nil)
	b.Run("guest-allowed", func(b *testing.B) {
		b.ReportAllocs()
		for b.Loop() {
			n.HasPermission(ctx, v1Role.CreateAction, v1.WildcardProject, v1Role.ProjectScope)
		}
	})
	b.Run("guest-miss-then-cache", func(b *testing.B) {
		b.ReportAllocs()
		for b.Loop() {
			n.HasPermission(ctx, v1Role.ReadAction, testProjectName(1), v1Role.DashboardScope)
		}
	})
}

// BenchmarkNativeGetUserProjects measures the listing of the projects a user can access,
// used for example when listing resources across all projects.
func BenchmarkNativeGetUserProjects(b *testing.B) {
	silenceTestLogs(b)
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, true)
		scenarios := []struct {
			name string
			ctx  echo.Context
		}{
			{name: "global-admin", ctx: newTestContext(testUserName(0), nil)},
			{name: "project-member", ctx: newTestContext(testUserName(1), nil)},
			{name: "unknown-user", ctx: newTestContext(testUnknownUser, nil)},
			{name: "claims/project-role", ctx: newTestContext(testClaimUser, map[string][]string{testClaimName: {testTeamClaim(size.projectCount - 1)}})},
		}
		for _, sc := range scenarios {
			b.Run(fmt.Sprintf("%s/%s", size, sc.name), func(b *testing.B) {
				if _, err := n.GetUserProjects(sc.ctx, v1Role.ReadAction, v1Role.DashboardScope); err != nil {
					b.Fatal(err)
				}
				b.ReportAllocs()
				for b.Loop() {
					_, _ = n.GetUserProjects(sc.ctx, v1Role.ReadAction, v1Role.DashboardScope)
				}
			})
		}
	}
}

// BenchmarkNativeGetPermissions measures the computation of the full permission map of a user,
// returned by the /api/v1/users/:name/permissions endpoint.
func BenchmarkNativeGetPermissions(b *testing.B) {
	silenceTestLogs(b)
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, true)
		scenarios := []struct {
			name string
			ctx  echo.Context
		}{
			{name: "global-admin", ctx: newTestContext(testUserName(0), nil)},
			{name: "project-member", ctx: newTestContext(testUserName(1), nil)},
			{name: "claims/project-role", ctx: newTestContext(testClaimUser, map[string][]string{testClaimName: {testTeamClaim(size.projectCount - 1)}})},
		}
		for _, sc := range scenarios {
			b.Run(fmt.Sprintf("%s/%s", size, sc.name), func(b *testing.B) {
				if _, err := n.GetPermissions(sc.ctx); err != nil {
					b.Fatal(err)
				}
				b.ReportAllocs()
				for b.Loop() {
					_, _ = n.GetPermissions(sc.ctx)
				}
			})
		}
	}
}

// BenchmarkClaimPermissions measures the resolution of the permissions granted by the JWT claims,
// depending on the number of mappings configured and the number of claim values the user has.
func BenchmarkClaimPermissions(b *testing.B) {
	silenceTestLogs(b)
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, true)
		c := n.cache.Load()
		for _, claimCount := range []int{1, 10} {
			if claimCount > size.projectCount {
				continue
			}
			values := make([]string, 0, claimCount)
			// Pick the last projects to hit the worst case of the role lookup.
			for i := 0; i < claimCount; i++ {
				values = append(values, testTeamClaim(size.projectCount-1-i))
			}
			claims := makeJWTClaims(testProviderKind, testProviderID, map[string][]string{testClaimName: values})
			b.Run(fmt.Sprintf("%s,mappings=%d,userClaims=%d", size, size.projectCount+1, claimCount), func(b *testing.B) {
				if got := n.claimPermissions(c, claims); len(got) != claimCount {
					b.Fatalf("unexpected number of projects resolved: got %d, expected %d", len(got), claimCount)
				}
				b.ReportAllocs()
				for b.Loop() {
					n.claimPermissions(c, claims)
				}
			})
		}
	}
}

// BenchmarkListHasPermission measures the core matching function depending on the number of permissions to scan.
func BenchmarkListHasPermission(b *testing.B) {
	for _, count := range []int{1, 10, 100, 1000} {
		permissions := make([]*v1Role.Permission, 0, count)
		for i := 0; i < count; i++ {
			permissions = append(permissions, &v1Role.Permission{
				Actions: []v1Role.Action{v1Role.ReadAction, v1Role.UpdateAction},
				Scopes:  []v1Role.Scope{v1Role.DashboardScope, v1Role.VariableScope},
			})
		}
		b.Run(fmt.Sprintf("permissions=%d/match-first", count), func(b *testing.B) {
			for b.Loop() {
				listHasPermission(permissions, v1Role.ReadAction, v1Role.DashboardScope)
			}
		})
		b.Run(fmt.Sprintf("permissions=%d/no-match", count), func(b *testing.B) {
			for b.Loop() {
				listHasPermission(permissions, v1Role.DeleteAction, v1Role.DatasourceScope)
			}
		})
	}
}

// BenchmarkNativeHasPermissionParallel measures HasPermission under concurrent requests,
// with and without a concurrent cache refresh.
func BenchmarkNativeHasPermissionParallel(b *testing.B) {
	silenceTestLogs(b)
	for _, size := range datasetSizes {
		ds := newTestDataset(size)
		n := ds.newNative(b, true)

		run := func(b *testing.B) {
			var goroutineID atomic.Int64
			b.ReportAllocs()
			b.ResetTimer()
			b.RunParallel(func(pb *testing.PB) {
				// Each goroutine simulates a different user requesting one of its projects.
				u := int(goroutineID.Add(1))%(size.userCount-1) + 1
				ctx := newTestContext(testUserName(u), nil)
				project := testProjectName(size.memberProject(u, 0))
				var result bool
				for pb.Next() {
					result = n.HasPermission(ctx, v1Role.ReadAction, project, v1Role.DashboardScope)
				}
				benchBoolSink.Store(result)
			})
		}

		b.Run(fmt.Sprintf("%s/no-refresh", size), run)

		concurrentRefreshName := fmt.Sprintf("%s/concurrent-refresh", size)
		start := time.Now()
		if err := n.RefreshPermissionsAndRoles(); err != nil {
			b.Fatal(err)
		}
		if refreshDuration := time.Since(start); refreshDuration > maxRefreshDurationForConcurrentBench {
			b.Run(concurrentRefreshName, func(b *testing.B) {
				b.Skipf("a refresh takes %s: no new cache would be published during the measurement", refreshDuration.Round(time.Millisecond))
			})
			continue
		}

		// The refresher is started once and kept alive for all the b.N rounds,
		// so that waiting for an in-flight refresh to finish is never part of the measure.
		stop := make(chan struct{})
		done := make(chan struct{})
		var refreshCount atomic.Int64
		go func() {
			defer close(done)
			for {
				select {
				case <-stop:
					return
				default:
					if err := n.RefreshPermissionsAndRoles(); err != nil {
						panic(err)
					}
					refreshCount.Add(1)
				}
			}
		}()
		b.Run(concurrentRefreshName, func(b *testing.B) {
			before := refreshCount.Load()
			run(b)
			b.StopTimer()
			b.ReportMetric(float64(refreshCount.Load()-before), "refreshes")
		})
		close(stop)
		<-done
	}
}
