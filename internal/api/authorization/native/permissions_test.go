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
	"testing"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/assert"
)

// referenceUsersPermissions is the previous implementation of buildUsersPermissions, which iterates over every
// binding for every user. It is kept as a reference to check that the new implementation gives the same result.
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
			testGlobalRoleBinding("auditors", "auditor", userSubjects("bob", "bob", "ghost")...), // duplicate and unknown users
			testGlobalRoleBinding("unknown-role", "unknown", userSubjects("carol")...),           // unknown role
			testGlobalRoleBinding("empty", "admin"),                                              // no subject
		},
		roleBindings: []*v1.RoleBinding{
			testRoleBinding("p1", "editors", "editor", userSubjects("alice", "carol")...),
			testRoleBinding("p1", "viewers", "viewer", userSubjects("carol", "ghost", "carol")...), // duplicate and unknown users
			testRoleBinding("p2", "editors", "editor", userSubjects("bob")...),                     // the role exists only in p1
			testRoleBinding("p2", "owners", "owner", userSubjects("alice")...),
			testRoleBinding("p2", "not-a-user", "owner", v1.Subject{Kind: v1.KindProject, Name: "dave"}), // not a user subject
		},
	}
}

func (ds *testDataset) buildUsersPermissions() usersPermissions {
	return buildUsersPermissions(ds.users, ds.globalRoles, ds.roles, ds.globalRoleBindings, ds.roleBindings)
}

func permissionValues(permissions []*v1Role.Permission) []v1Role.Permission {
	values := make([]v1Role.Permission, 0, len(permissions))
	for _, permission := range permissions {
		values = append(values, *permission)
	}
	return values
}

func TestBuildUsersPermissions(t *testing.T) {
	silenceTestLogs(t)
	permissions := edgeCaseDataset().buildUsersPermissions()

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

func TestBuildUsersPermissionsMatchesPreviousAlgorithm(t *testing.T) {
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
			assert.Equal(t, expected, ds.buildUsersPermissions())
		})
	}
}
