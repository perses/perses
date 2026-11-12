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
	"encoding/json"
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/assert"
)

// referenceUsersPermissions is the previous implementation of the users permissions computed by buildCache, which
// iterates over every binding for every user. It is kept as a reference to check that the new implementation gives
// the same result.
func referenceUsersPermissions(users []*v1.User, globalRoles []*v1.GlobalRole, roles []*v1.Role,
	globalRoleBindings []*v1.GlobalRoleBinding, roleBindings []*v1.RoleBinding) usersPermissions {
	permissionBuild := make(usersPermissions)
	for _, usr := range users {
		for _, globalRoleBinding := range globalRoleBindings {
			if globalRoleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				globalRole := findGlobalRole(globalRoles, globalRoleBinding.Spec.Role)
				if globalRole == nil {
					continue
				}
				globalRolePermissions := globalRole.Spec.Permissions
				for i := range globalRolePermissions {
					permissionBuild.addEntry(usr.Metadata.Name, v1.WildcardProject, &globalRolePermissions[i])
				}
			}
		}
	}
	for _, usr := range users {
		for _, roleBinding := range roleBindings {
			if roleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				projectRole := findRole(roles, roleBinding.Metadata.Project, roleBinding.Spec.Role)
				if projectRole == nil {
					continue
				}
				rolePermissions := projectRole.Spec.Permissions
				for i := range rolePermissions {
					permissionBuild.addEntry(usr.Metadata.Name, roleBinding.Metadata.Project, &rolePermissions[i])
				}
			}
		}
	}
	return permissionBuild
}

func userSubjects(names ...string) []v1.Subject {
	subjects := make([]v1.Subject, 0, len(names))
	for _, name := range names {
		subjects = append(subjects, v1.Subject{Kind: v1.KindUser, Name: name})
	}
	return subjects
}

func testGlobalRole(name string, permissions ...v1Role.Permission) *v1.GlobalRole {
	return &v1.GlobalRole{Kind: v1.KindGlobalRole, Metadata: v1.Metadata{Name: name}, Spec: v1.RoleSpec{Permissions: permissions}}
}

func testRole(project, name string, permissions ...v1Role.Permission) *v1.Role {
	return &v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata:               v1.Metadata{Name: name},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: project},
		},
		Spec: v1.RoleSpec{Permissions: permissions},
	}
}

func testGlobalRoleBinding(name, role string, subjects ...v1.Subject) *v1.GlobalRoleBinding {
	return &v1.GlobalRoleBinding{Kind: v1.KindGlobalRoleBinding, Metadata: v1.Metadata{Name: name}, Spec: v1.RoleBindingSpec{Role: role, Subjects: subjects}}
}

// asReadFromDatabase returns the entity as the native authorization gets it from the database: marshalled, then
// unmarshalled. In particular, the duplicated subjects of the role bindings are removed by the unmarshalling.
func asReadFromDatabase[T any](entity *T) *T {
	data, err := json.Marshal(entity)
	if err != nil {
		panic(err)
	}
	result := new(T)
	if err := json.Unmarshal(data, result); err != nil {
		panic(err)
	}
	return result
}

func testRoleBinding(project, name, role string, subjects ...v1.Subject) *v1.RoleBinding {
	return &v1.RoleBinding{
		Kind: v1.KindRoleBinding,
		Metadata: v1.ProjectMetadata{
			Metadata:               v1.Metadata{Name: name},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: project},
		},
		Spec: v1.RoleBindingSpec{Role: role, Subjects: subjects},
	}
}

// edgeCaseDataset is a hand-written dataset with the tricky cases of the permission computation.
func edgeCaseDataset() *testDataset {
	return &testDataset{
		users: []*v1.User{
			{Metadata: v1.Metadata{Name: "alice"}},
			{Metadata: v1.Metadata{Name: "bob"}},
			{Metadata: v1.Metadata{Name: "carol"}},
			{Metadata: v1.Metadata{Name: "dave"}}, // bound to nothing usable
		},
		globalRoles: []*v1.GlobalRole{
			testGlobalRole("admin", testWildcardPermission),
			testGlobalRole("auditor", testReadAllPermission),
			testGlobalRole("auditor", testWildcardPermission), // duplicate: the first one wins
		},
		roles: []*v1.Role{
			testRole("p1", "editor", testReadAllPermission, testEditPermission),
			testRole("p1", "viewer", testReadAllPermission),
			testRole("p1", "viewer", testWildcardPermission), // duplicate: the first one wins
			testRole("p2", "owner", testWildcardPermission),
		},
		globalRoleBindings: []*v1.GlobalRoleBinding{
			testGlobalRoleBinding("admins", "admin", userSubjects("alice")...),
			// bob is listed twice: the duplicate is removed when the binding is read from the database. ghost is unknown.
			asReadFromDatabase(testGlobalRoleBinding("auditors", "auditor", userSubjects("bob", "bob", "ghost")...)),
			testGlobalRoleBinding("unknown-role", "unknown", userSubjects("carol")...), // unknown role
			// A binding without subject can't come from the database (rejected by the unmarshalling): defensive case.
			testGlobalRoleBinding("empty", "admin"),
		},
		roleBindings: []*v1.RoleBinding{
			testRoleBinding("p1", "editors", "editor", userSubjects("alice", "carol")...),
			// carol is listed twice: the duplicate is removed when the binding is read from the database. ghost is unknown.
			asReadFromDatabase(testRoleBinding("p1", "viewers", "viewer", userSubjects("carol", "ghost", "carol")...)),
			testRoleBinding("p2", "editors", "editor", userSubjects("bob")...), // the role exists only in p1
			testRoleBinding("p2", "owners", "owner", userSubjects("alice")...),
			// A subject that is not a user can't come from the database (rejected by the unmarshalling): defensive case.
			testRoleBinding("p2", "not-a-user", "owner", v1.Subject{Kind: v1.KindProject, Name: "dave"}),
		},
	}
}

func (ds *testDataset) buildCache() *cache {
	return buildCache(ds.users, ds.globalRoles, ds.roles, ds.globalRoleBindings, ds.roleBindings)
}

var testCreateProjectPermission = v1Role.Permission{
	Actions: []v1Role.Action{v1Role.CreateAction},
	Scopes:  []v1Role.Scope{v1Role.ProjectScope},
}

// wildcardUserDataset is a hand-written dataset with bindings to the wildcard subject.
func wildcardUserDataset() *testDataset {
	return &testDataset{
		users: []*v1.User{
			{Metadata: v1.Metadata{Name: "alice"}},
			{Metadata: v1.Metadata{Name: "bob"}},
			{Metadata: v1.Metadata{Name: "carol"}},
		},
		globalRoles: []*v1.GlobalRole{
			testGlobalRole("project-creator", testCreateProjectPermission),
			testGlobalRole("reader", testReadAllPermission), // only granted through the claims
		},
		roles: []*v1.Role{
			testRole("p1", "viewer", testReadAllPermission),
			testRole("p1", "editor", testEditPermission),
			testRole("p2", "viewer", testReadAllPermission),
			testRole("p3", "viewer", testReadAllPermission), // only granted through the claims
		},
		globalRoleBindings: []*v1.GlobalRoleBinding{
			asReadFromDatabase(testGlobalRoleBinding("everyone", "project-creator", userSubjects(v1.WildcardUser)...)),
		},
		roleBindings: []*v1.RoleBinding{
			// alice is listed by name and through the wildcard subject: she must get the permissions of the role once.
			asReadFromDatabase(testRoleBinding("p1", "everyone", "viewer", userSubjects("alice", v1.WildcardUser)...)),
			asReadFromDatabase(testRoleBinding("p1", "editors", "editor", userSubjects("bob")...)),
			asReadFromDatabase(testRoleBinding("p2", "viewers", "viewer", userSubjects("carol")...)),
			asReadFromDatabase(testRoleBinding("p2", "everyone", "editor", userSubjects(v1.WildcardUser)...)), // the role exists only in p1
			// A subject that is not a user can't come from the database (rejected by the unmarshalling): defensive case.
			testRoleBinding("p2", "not-a-user", "viewer", v1.Subject{Kind: v1.KindProject, Name: v1.WildcardUser}),
		},
	}
}

func permissionValues(permissions []*v1Role.Permission) []v1Role.Permission {
	values := make([]v1Role.Permission, 0, len(permissions))
	for _, permission := range permissions {
		values = append(values, *permission)
	}
	return values
}

func permissionValuesByProject(permissions map[string][]*v1Role.Permission) map[string][]v1Role.Permission {
	values := make(map[string][]v1Role.Permission, len(permissions))
	for project, projectPermissions := range permissions {
		values[project] = permissionValues(projectPermissions)
	}
	return values
}

func TestBuildCache(t *testing.T) {
	silenceTestLogs(t)
	c := edgeCaseDataset().buildCache()
	permissions := c.permissions

	assert.Empty(t, c.allUsersPermissions, "no binding uses the wildcard subject")

	assert.Len(t, permissions, 3, "only alice, bob and carol get permissions")
	assert.NotContains(t, permissions, "dave", "dave is only bound through a subject that is not a user")
	assert.NotContains(t, permissions, "ghost", "ghost is not an existing user")

	// alice: global admin, editor in p1 and owner in p2
	assert.Len(t, permissions["alice"], 3)
	assert.Equal(t, []v1Role.Permission{testWildcardPermission}, permissionValues(permissions["alice"][v1.WildcardProject]))
	assert.Equal(t, []v1Role.Permission{testReadAllPermission, testEditPermission}, permissionValues(permissions["alice"]["p1"]))
	assert.Equal(t, []v1Role.Permission{testWildcardPermission}, permissionValues(permissions["alice"]["p2"]))

	// bob: auditor once, with the permissions of the first "auditor" role. Nothing in p2, where "editor" doesn't exist.
	assert.Len(t, permissions["bob"], 1)
	assert.Equal(t, []v1Role.Permission{testReadAllPermission}, permissionValues(permissions["bob"][v1.WildcardProject]))

	// carol: nothing global as the role doesn't exist, editor then viewer once (first "viewer" role) in p1.
	assert.Len(t, permissions["carol"], 1)
	assert.Equal(t, []v1Role.Permission{testReadAllPermission, testEditPermission, testReadAllPermission}, permissionValues(permissions["carol"]["p1"]))
}

func TestBuildCacheWithWildcardUser(t *testing.T) {
	silenceTestLogs(t)
	c := wildcardUserDataset().buildCache()

	// The permissions granted through the wildcard subject are stored once, instead of being copied to every user.
	assert.Len(t, c.allUsersPermissions, 2, "the binding to an unknown role and the subject that is not a user are ignored")
	assert.Equal(t, []v1Role.Permission{testCreateProjectPermission}, permissionValues(c.allUsersPermissions[v1.WildcardProject]))
	assert.Equal(t, []v1Role.Permission{testReadAllPermission}, permissionValues(c.allUsersPermissions["p1"]))

	// Only the users listed by name in a binding without the wildcard subject get their own permissions.
	assert.Len(t, c.permissions, 2)
	assert.NotContains(t, c.permissions, "alice", "alice is only listed in a binding to the wildcard subject")
	assert.Equal(t, map[string][]v1Role.Permission{"p1": {testEditPermission}}, permissionValuesByProject(c.permissions["bob"]))
	assert.Equal(t, map[string][]v1Role.Permission{"p2": {testReadAllPermission}}, permissionValuesByProject(c.permissions["carol"]))
}

func TestBuildCacheMatchesPreviousAlgorithm(t *testing.T) {
	silenceTestLogs(t)
	datasets := map[string]*testDataset{
		"edge cases": edgeCaseDataset(),
		// The previous algorithm is too slow to be used as a reference on the largest dataset.
		datasetSizes[0].String(): newTestDataset(datasetSizes[0]),
		datasetSizes[1].String(): newTestDataset(datasetSizes[1]),
	}
	for name, ds := range datasets {
		t.Run(name, func(t *testing.T) {
			expected := referenceUsersPermissions(ds.users, ds.globalRoles, ds.roles, ds.globalRoleBindings, ds.roleBindings)
			// Same users, projects and permissions, in the same order.
			assert.Equal(t, expected, ds.buildCache().permissions)
		})
	}
}
