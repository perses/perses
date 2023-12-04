// Copyright 2023 The Perses Authors
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

package rbac

import (
	"fmt"
	"testing"

	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/assert"
)

func generateMockCache(userCount int, projectCountByUser int) Cache {
	usersPermissions := make(usersPermissions)
	for u := 1; u <= userCount; u++ {
		for p := 1; p <= projectCountByUser; p++ {
			addEntry(usersPermissions, fmt.Sprintf("user%d", u), fmt.Sprintf("project%d", p), &role.Permission{
				Actions: []role.Action{role.WildcardAction},
				Scopes:  []role.Scope{role.WildcardScope},
			})
		}
	}
	return Cache{UsersPermissions: usersPermissions}
}

func smallMockCache() Cache {
	usersPermissions := make(usersPermissions)
	addEntry(usersPermissions, "user0", "project0", &role.Permission{
		Actions: []role.Action{role.CreateAction},
		Scopes:  []role.Scope{role.DashboardScope},
	})
	addEntry(usersPermissions, "user0", "project0", &role.Permission{
		Actions: []role.Action{role.CreateAction},
		Scopes:  []role.Scope{role.VariableScope},
	})
	addEntry(usersPermissions, "user1", "project0", &role.Permission{
		Actions: []role.Action{role.CreateAction},
		Scopes:  []role.Scope{role.WildcardScope},
	})
	addEntry(usersPermissions, "user2", "project1", &role.Permission{
		Actions: []role.Action{role.WildcardAction},
		Scopes:  []role.Scope{role.DashboardScope},
	})
	addEntry(usersPermissions, "admin", GlobalProject, &role.Permission{
		Actions: []role.Action{role.WildcardAction},
		Scopes:  []role.Scope{role.WildcardScope},
	})

	return Cache{UsersPermissions: usersPermissions}
}

func TestCacheHasPermission(t *testing.T) {
	smallCache := smallMockCache()

	testSuites := []struct {
		title          string
		cache          Cache
		user           string
		reqAction      role.Action
		reqProject     string
		reqScope       role.Scope
		expectedResult bool
	}{
		{
			title:          "empty cache",
			cache:          Cache{},
			user:           "user0",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user0 'create' has perm on 'project0' for 'dashboard' scope",
			cache:          smallMockCache(),
			user:           "user0",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user0 has 'create' perm on 'project0' for 'variable' scope",
			cache:          smallCache,
			user:           "user0",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user0 hasn't 'create' perm on 'project0' for 'datasource' scope",
			cache:          smallCache,
			user:           "user0",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.DatasourceScope,
			expectedResult: false,
		},
		// Testing scope wildcard on a project
		{
			title:          "user1 has 'create' perm on 'project0' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.DatasourceScope,
			expectedResult: true,
		},
		{
			title:          "user1 has 'create' perm on 'project0' for 'datasource' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.DatasourceScope,
			expectedResult: true,
		},
		{
			title:          "user1 has 'create' perm on 'project0' for 'variable' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      role.CreateAction,
			reqProject:     "project0",
			reqScope:       role.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user1 hasn't 'create' perm for 'globaldatasource' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      role.CreateAction,
			reqProject:     GlobalProject,
			reqScope:       role.GlobalDatasourceScope,
			expectedResult: false,
		},
		// Testing action wildcard on a project
		{
			title:          "user2 has 'create' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      role.CreateAction,
			reqProject:     "project1",
			reqScope:       role.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user2 has 'update' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      role.UpdateAction,
			reqProject:     "project1",
			reqScope:       role.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user2 has 'read' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      role.ReadAction,
			reqProject:     "project1",
			reqScope:       role.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user2 has 'delete' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      role.DeleteAction,
			reqProject:     "project1",
			reqScope:       role.DashboardScope,
			expectedResult: true,
		},
		// Testing global role wildcard on a project
		{
			title:          "admin has 'create' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "admin",
			reqAction:      role.CreateAction,
			reqProject:     "project1",
			reqScope:       role.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "admin has 'update' perm for 'globalrole' scope",
			cache:          smallCache,
			user:           "admin",
			reqAction:      role.UpdateAction,
			reqProject:     GlobalProject,
			reqScope:       role.GlobalRoleScope,
			expectedResult: true,
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			assert.Equal(t, test.expectedResult, test.cache.HasPermission(test.user, test.reqAction, test.reqProject, test.reqScope))
		})
	}
}

func BenchmarkCacheHasPermission(b *testing.B) {
	benchSuites := []struct {
		userCount          int
		projectCountByUser int
	}{
		{
			userCount:          10,
			projectCountByUser: 1,
		},
		{
			userCount:          100,
			projectCountByUser: 1,
		},
		{
			userCount:          100,
			projectCountByUser: 2,
		},
		{
			userCount:          100,
			projectCountByUser: 3,
		},
		{
			userCount:          1000,
			projectCountByUser: 5,
		},
		{
			userCount:          10000,
			projectCountByUser: 20,
		},
		{
			userCount:          10,
			projectCountByUser: 100,
		},
		{
			userCount:          10,
			projectCountByUser: 1000,
		},
		{
			userCount:          10,
			projectCountByUser: 10000,
		},
	}
	for _, bench := range benchSuites {
		cache := generateMockCache(bench.userCount, bench.projectCountByUser)
		b.Run(fmt.Sprintf("HasPermission(userCount:%d,projectCountByUser:%d)", bench.userCount, bench.projectCountByUser), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				cache.HasPermission("user0", role.CreateAction, "project0", role.DashboardScope)
			}
		})
		b.Run(fmt.Sprintf("HasNotPermission(userCount:%d,projectCountByUser:%d)", bench.userCount, bench.projectCountByUser), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				cache.HasPermission(fmt.Sprintf("user%d", bench.userCount), role.CreateAction, fmt.Sprintf("project%d", bench.projectCountByUser), role.DashboardScope)
			}
		})
	}
}
