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
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

// This file contains the fixtures shared by the tests and the benchmarks of the native authorization:
// fake DAOs, and a generator of realistic datasets (users, roles, bindings and claim mappings) of various sizes.

const (
	testProviderKind     = utils.AuthnKindOIDC
	testProviderID       = "test"
	testClaimName        = "groups"
	testGlobalAdminRole  = "admin"
	testGlobalViewerRole = "global-viewer"
	testClaimUser        = "claim-user"
	testUnknownUser      = "unknown-user"
	testAdminClaimValue  = "perses-admins"
)

// ---------------------------------------------------------------------------
// Fake DAOs: only List is used by the native authorization.
// Embedding the interface makes any other (unexpected) call panic.
// ---------------------------------------------------------------------------

type fakeUserDAO struct {
	user.DAO
	items []*v1.User
}

func (d *fakeUserDAO) List(_ *user.Query) ([]*v1.User, error) { return d.items, nil }

type fakeRoleDAO struct {
	role.DAO
	items []*v1.Role
}

func (d *fakeRoleDAO) List(_ *role.Query) ([]*v1.Role, error) { return d.items, nil }

type fakeRoleBindingDAO struct {
	rolebinding.DAO
	items []*v1.RoleBinding
}

func (d *fakeRoleBindingDAO) List(_ *rolebinding.Query) ([]*v1.RoleBinding, error) {
	return d.items, nil
}

type fakeGlobalRoleDAO struct {
	globalrole.DAO
	items []*v1.GlobalRole
}

func (d *fakeGlobalRoleDAO) List(_ *globalrole.Query) ([]*v1.GlobalRole, error) {
	return d.items, nil
}

type fakeGlobalRoleBindingDAO struct {
	globalrolebinding.DAO
	items []*v1.GlobalRoleBinding
}

func (d *fakeGlobalRoleBindingDAO) List(_ *globalrolebinding.Query) ([]*v1.GlobalRoleBinding, error) {
	return d.items, nil
}

// ---------------------------------------------------------------------------
// Dataset generation
// ---------------------------------------------------------------------------

type datasetSize struct {
	userCount       int
	projectCount    int
	projectsPerUser int
}

func (s datasetSize) String() string {
	return fmt.Sprintf("users=%d,projects=%d,projectsPerUser=%d", s.userCount, s.projectCount, s.projectsPerUser)
}

// memberProject returns the k-th project the user u is a member of.
func (s datasetSize) memberProject(u, k int) int { return (u + k) % s.projectCount }

// nonMemberProject returns a project the user u is NOT a member of.
func (s datasetSize) nonMemberProject(u int) int { return (u + s.projectsPerUser) % s.projectCount }

var datasetSizes = []datasetSize{
	{userCount: 100, projectCount: 10, projectsPerUser: 2},
	{userCount: 1000, projectCount: 100, projectsPerUser: 5},
	{userCount: 10000, projectCount: 1000, projectsPerUser: 10},
}

var (
	testWildcardPermission = v1Role.Permission{
		Actions: []v1Role.Action{v1Role.WildcardAction},
		Scopes:  []v1Role.Scope{v1Role.WildcardScope},
	}
	testReadAllPermission = v1Role.Permission{
		Actions: []v1Role.Action{v1Role.ReadAction},
		Scopes:  []v1Role.Scope{v1Role.WildcardScope},
	}
	testEditPermission = v1Role.Permission{
		Actions: []v1Role.Action{v1Role.CreateAction, v1Role.UpdateAction, v1Role.DeleteAction},
		Scopes:  []v1Role.Scope{v1Role.DashboardScope, v1Role.VariableScope, v1Role.DatasourceScope, v1Role.FolderScope},
	}
)

// testProjectRoles are the roles created in every project.
var testProjectRoles = []struct {
	name        string
	permissions []v1Role.Permission
}{
	{name: "viewer", permissions: []v1Role.Permission{testReadAllPermission}},
	{name: "editor", permissions: []v1Role.Permission{testReadAllPermission, testEditPermission}},
	{name: "owner", permissions: []v1Role.Permission{testWildcardPermission}},
}

func testUserName(i int) string    { return fmt.Sprintf("user%d", i) }
func testProjectName(i int) string { return fmt.Sprintf("project%d", i) }
func testTeamClaim(i int) string   { return fmt.Sprintf("team%d", i) }

type testDataset struct {
	size               datasetSize
	users              []*v1.User
	roles              []*v1.Role
	globalRoles        []*v1.GlobalRole
	roleBindings       []*v1.RoleBinding
	globalRoleBindings []*v1.GlobalRoleBinding
}

// newTestDataset generates a realistic set of users, roles and bindings:
//   - user0 is bound to the "admin" GlobalRole,
//   - every 50th user is bound to the "global-viewer" GlobalRole,
//   - every project has 3 roles (viewer, editor, owner), each with one RoleBinding,
//   - every user (except user0) is a member of projectsPerUser projects, with a rotating role.
func newTestDataset(size datasetSize) *testDataset {
	if size.projectsPerUser >= size.projectCount {
		panic("projectsPerUser must be strictly lower than projectCount")
	}
	ds := &testDataset{size: size}

	// Users
	ds.users = make([]*v1.User, 0, size.userCount)
	for u := 0; u < size.userCount; u++ {
		ds.users = append(ds.users, &v1.User{Kind: v1.KindUser, Metadata: v1.Metadata{Name: testUserName(u)}})
	}

	// Global roles & bindings
	ds.globalRoles = []*v1.GlobalRole{
		{
			Kind:     v1.KindGlobalRole,
			Metadata: v1.Metadata{Name: testGlobalAdminRole},
			Spec:     v1.RoleSpec{Permissions: []v1Role.Permission{testWildcardPermission}},
		},
		{
			Kind:     v1.KindGlobalRole,
			Metadata: v1.Metadata{Name: testGlobalViewerRole},
			Spec:     v1.RoleSpec{Permissions: []v1Role.Permission{testReadAllPermission}},
		},
	}
	viewerBinding := &v1.GlobalRoleBinding{
		Kind:     v1.KindGlobalRoleBinding,
		Metadata: v1.Metadata{Name: testGlobalViewerRole},
		Spec:     v1.RoleBindingSpec{Role: testGlobalViewerRole},
	}
	for u := 50; u < size.userCount; u += 50 {
		viewerBinding.Spec.Subjects = append(viewerBinding.Spec.Subjects, v1.Subject{Kind: v1.KindUser, Name: testUserName(u)})
	}
	ds.globalRoleBindings = []*v1.GlobalRoleBinding{
		{
			Kind:     v1.KindGlobalRoleBinding,
			Metadata: v1.Metadata{Name: testGlobalAdminRole},
			Spec: v1.RoleBindingSpec{
				Role:     testGlobalAdminRole,
				Subjects: []v1.Subject{{Kind: v1.KindUser, Name: testUserName(0)}},
			},
		},
		viewerBinding,
	}

	// Project roles & bindings
	ds.roles = make([]*v1.Role, 0, size.projectCount*len(testProjectRoles))
	ds.roleBindings = make([]*v1.RoleBinding, 0, size.projectCount*len(testProjectRoles))
	for p := 0; p < size.projectCount; p++ {
		for _, r := range testProjectRoles {
			projectMetadata := v1.ProjectMetadata{
				Metadata:               v1.Metadata{Name: r.name},
				ProjectMetadataWrapper: v1.ProjectMetadataWrapper{Project: testProjectName(p)},
			}
			ds.roles = append(ds.roles, &v1.Role{
				Kind:     v1.KindRole,
				Metadata: projectMetadata,
				Spec:     v1.RoleSpec{Permissions: slices.Clone(r.permissions)},
			})
			ds.roleBindings = append(ds.roleBindings, &v1.RoleBinding{
				Kind:     v1.KindRoleBinding,
				Metadata: projectMetadata,
				Spec:     v1.RoleBindingSpec{Role: r.name},
			})
		}
	}
	for u := 1; u < size.userCount; u++ {
		for k := 0; k < size.projectsPerUser; k++ {
			p := size.memberProject(u, k)
			r := (u + k) % len(testProjectRoles)
			binding := ds.roleBindings[p*len(testProjectRoles)+r]
			binding.Spec.Subjects = append(binding.Spec.Subjects, v1.Subject{Kind: v1.KindUser, Name: testUserName(u)})
		}
	}
	return ds
}

// claimMappings maps one claim value per project to the "editor" role of that project,
// plus one claim value to the "admin" GlobalRole. It mimics an organization mapping every team
// of its IdP to a Perses project.
func (ds *testDataset) claimMappings() map[providerKey][]claimRoleMapping {
	mappings := make([]claimRoleMapping, 0, ds.size.projectCount+1)
	mappings = append(mappings, claimRoleMapping{
		claimName:  testClaimName,
		claimValue: testAdminClaimValue,
		roleName:   testGlobalAdminRole,
	})
	for p := 0; p < ds.size.projectCount; p++ {
		mappings = append(mappings, claimRoleMapping{
			claimName:  testClaimName,
			claimValue: testTeamClaim(p),
			roleName:   "editor",
			project:    testProjectName(p),
		})
	}
	return map[providerKey][]claimRoleMapping{
		{kind: testProviderKind, id: testProviderID}: mappings,
	}
}

// newNative returns a native authorization backed by the dataset, with its permission cache already built.
func (ds *testDataset) newNative(tb testing.TB, withClaimMappings bool) *native {
	tb.Helper()
	n := &native{
		cache:                &cache{},
		userDAO:              &fakeUserDAO{items: ds.users},
		roleDAO:              &fakeRoleDAO{items: ds.roles},
		roleBindingDAO:       &fakeRoleBindingDAO{items: ds.roleBindings},
		globalRoleDAO:        &fakeGlobalRoleDAO{items: ds.globalRoles},
		globalRoleBindingDAO: &fakeGlobalRoleBindingDAO{items: ds.globalRoleBindings},
	}
	if withClaimMappings {
		n.claimMappings = ds.claimMappings()
	}
	if err := n.RefreshPermissionsAndRoles(); err != nil {
		tb.Fatalf("unable to build the permission cache: %v", err)
	}
	return n
}

// newTestContext returns a request context authenticated as the given user, as set by the JWT middleware.
// The persisted claims are attached to the test OIDC provider.
func newTestContext(username string, persistedClaims map[string][]string) echo.Context {
	ctx := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/", nil), httptest.NewRecorder())
	claims := &crypto.JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{Subject: username},
		PersistedClaims:  persistedClaims,
	}
	if len(persistedClaims) > 0 {
		claims.ProviderInfo = crypto.ProviderInfo{ProviderKind: testProviderKind, ProviderID: testProviderID}
	}
	ctx.Set("user", &jwt.Token{Claims: claims})
	return ctx
}

// silenceTestLogs disables the logs (e.g. warnings about unknown roles) for the duration of the test.
func silenceTestLogs(tb testing.TB) {
	tb.Helper()
	level := logrus.GetLevel()
	logrus.SetLevel(logrus.PanicLevel)
	tb.Cleanup(func() { logrus.SetLevel(level) })
}
