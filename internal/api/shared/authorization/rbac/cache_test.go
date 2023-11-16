package rbac_test

import (
	"testing"

	"github.com/perses/perses/internal/api/shared/authorization/rbac"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func generateBasicMockCache() rbac.Cache {
	usersPermissions := make(rbac.UsersPermissions)
	rbac.AddEntry(usersPermissions, "user0", "project0", &v1.Permission{
		Actions: []v1.ActionKind{v1.CreateAction},
		Scopes:  []v1.ScopeKind{v1.DashboardScope},
	})
	rbac.AddEntry(usersPermissions, "user0", "project0", &v1.Permission{
		Actions: []v1.ActionKind{v1.CreateAction},
		Scopes:  []v1.ScopeKind{v1.VariableScope},
	})
	rbac.AddEntry(usersPermissions, "user1", "project0", &v1.Permission{
		Actions: []v1.ActionKind{v1.CreateAction},
		Scopes:  []v1.ScopeKind{v1.WildcardScope},
	})
	rbac.AddEntry(usersPermissions, "user2", "project1", &v1.Permission{
		Actions: []v1.ActionKind{v1.WildcardAction},
		Scopes:  []v1.ScopeKind{v1.DashboardScope},
	})
	rbac.AddEntry(usersPermissions, "admin", rbac.GlobalProject, &v1.Permission{
		Actions: []v1.ActionKind{v1.WildcardAction},
		Scopes:  []v1.ScopeKind{v1.WildcardScope},
	})

	return rbac.Cache{UsersPermissions: usersPermissions}
}

func TestCacheHasPermission(t *testing.T) {
	smallCache := generateBasicMockCache()

	testSuites := []struct {
		title          string
		cache          rbac.Cache
		user           string
		reqAction      v1.ActionKind
		reqProject     string
		reqScope       v1.ScopeKind
		expectedResult bool
	}{
		{
			title:          "empty cache",
			cache:          rbac.Cache{},
			user:           "user0",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user0 'create' has perm on 'project0' for 'dashboard' scope",
			cache:          generateBasicMockCache(),
			user:           "user0",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user0 has 'create' perm on 'project0' for 'variable' scope",
			cache:          smallCache,
			user:           "user0",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user0 hasn't 'create' perm on 'project0' for 'datasource' scope",
			cache:          smallCache,
			user:           "user0",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.DatasourceScope,
			expectedResult: false,
		},
		// Testing scope wildcard on a project
		{
			title:          "user1 has 'create' perm on 'project0' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.DatasourceScope,
			expectedResult: true,
		},
		{
			title:          "user1 has 'create' perm on 'project0' for 'datasource' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.DatasourceScope,
			expectedResult: true,
		},
		{
			title:          "user1 has 'create' perm on 'project0' for 'variable' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      v1.CreateAction,
			reqProject:     "project0",
			reqScope:       v1.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user1 hasn't 'create' perm for 'globaldatasource' scope",
			cache:          smallCache,
			user:           "user1",
			reqAction:      v1.CreateAction,
			reqProject:     rbac.GlobalProject,
			reqScope:       v1.GlobalDatasourceScope,
			expectedResult: false,
		},
		// Testing action wildcard on a project
		{
			title:          "user2 has 'create' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      v1.CreateAction,
			reqProject:     "project1",
			reqScope:       v1.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user2 has 'update' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      v1.UpdateAction,
			reqProject:     "project1",
			reqScope:       v1.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user2 has 'read' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      v1.ReadAction,
			reqProject:     "project1",
			reqScope:       v1.DashboardScope,
			expectedResult: true,
		},
		{
			title:          "user2 has 'delete' perm on 'project1' for 'dashboard' scope",
			cache:          smallCache,
			user:           "user2",
			reqAction:      v1.DeleteAction,
			reqProject:     "project1",
			reqScope:       v1.DashboardScope,
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
