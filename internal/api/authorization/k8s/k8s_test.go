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

package k8s

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/assert"
	authnv1 "k8s.io/api/authentication/v1"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/authentication/authenticator"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/authorization/authorizer"
	"k8s.io/client-go/kubernetes/fake"
	authenticationclient "k8s.io/client-go/kubernetes/typed/authentication/v1"
	authorizationclient "k8s.io/client-go/kubernetes/typed/authorization/v1"
	k8stesting "k8s.io/client-go/testing"
)

// The standard Authenticator and Authorizer perform more actions than just checking the token review
// subjectaccessreview and will attempt to contact the API server to perform them. Since we are trying to
// fake the API server's responses, there is no dedicated cluster so those requests will fail, thus we
// recreate the simplest path of completing the tokenreview and subjectaccessreview checks
type mockAuthenticator struct {
	client authenticationclient.AuthenticationV1Interface
}

func (m *mockAuthenticator) AuthenticateRequest(req *http.Request) (*authenticator.Response, bool, error) {
	authHeader := req.Header.Get("Authorization")
	if authHeader == "" {
		return nil, false, nil
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	token = strings.TrimPrefix(token, "bearer ")

	tr := &authnv1.TokenReview{
		Spec: authnv1.TokenReviewSpec{
			Token: token,
		},
	}

	result, err := m.client.TokenReviews().Create(context.Background(), tr, metav1.CreateOptions{})
	if err != nil {
		return nil, false, err
	}

	if !result.Status.Authenticated {
		return nil, false, nil
	}

	userInfo := &user.DefaultInfo{
		Name:   result.Status.User.Username,
		UID:    result.Status.User.UID,
		Groups: result.Status.User.Groups,
		Extra:  make(map[string][]string),
	}

	return &authenticator.Response{
		User: userInfo,
	}, true, nil
}

type mockAuthorizer struct {
	client authorizationclient.AuthorizationV1Interface
}

func (m *mockAuthorizer) Authorize(ctx context.Context, attr authorizer.Attributes) (authorizer.Decision, string, error) {
	sar := &authv1.SubjectAccessReview{
		Spec: authv1.SubjectAccessReviewSpec{
			User:   attr.GetUser().GetName(),
			Groups: attr.GetUser().GetGroups(),
			ResourceAttributes: &authv1.ResourceAttributes{
				Namespace:   attr.GetNamespace(),
				Verb:        attr.GetVerb(),
				Group:       attr.GetAPIGroup(),
				Version:     attr.GetAPIVersion(),
				Resource:    attr.GetResource(),
				Subresource: attr.GetSubresource(),
				Name:        attr.GetName(),
			},
		},
	}

	result, err := m.client.SubjectAccessReviews().Create(ctx, sar, metav1.CreateOptions{})
	if err != nil {
		return authorizer.DecisionNoOpinion, "", err
	}

	if result.Status.Allowed {
		return authorizer.DecisionAllow, result.Status.Reason, nil
	}

	return authorizer.DecisionDeny, result.Status.Reason, nil
}

func newK8sMock(t *testing.T) *k8sImpl {
	clientset := fake.NewClientset()

	assert.NoError(t, createNamespace(clientset, projectPerses))
	assert.NoError(t, createNamespace(clientset, projectZero))
	assert.NoError(t, createNamespace(clientset, projectOne))

	mockAuthentication(clientset)
	mockAuthorization(clientset)

	fakeAuthenticator := &mockAuthenticator{
		client: clientset.AuthenticationV1(),
	}

	fakeAuthorizer := &mockAuthorizer{
		client: clientset.AuthorizationV1(),
	}

	return &k8sImpl{
		authenticator: fakeAuthenticator,
		authorizer:    fakeAuthorizer,
		kubeClient:    clientset,
	}
}

func createNamespace(clientset *fake.Clientset, namespace string) error {
	_, err := clientset.CoreV1().Namespaces().Create(context.Background(), &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespace,
		},
	}, metav1.CreateOptions{})
	return err
}

var (
	// Admin has full permissions
	userAdmin = "admin"
	// User0 has access to read in project0 only and GlobalDatasource in in all projects
	userZero = "user0"
	// User1 has no permissions
	userOne = "user1"
	// user2 has read permissions in all namespaces and create permissions in project0
	// but no globaldatasource permissions
	userTwo = "user2"
	// user3 has read access to GlobalDatasource only, no project-scoped permissions
	userThree = "user3"
	// user4 has read access to Datasource in project0 only. Tests that this user has
	// read access to a project, but not access to the non-k8s resources
	userFour = "user4"
)

var (
	projectPerses = "perses"
	projectZero   = "project0"
	projectOne    = "project1"
)

func mockAuthentication(clientset *fake.Clientset) {
	clientset.PrependReactor("create", "tokenreviews",
		func(action k8stesting.Action) (handled bool, ret runtime.Object, err error) {

			createAction := action.(k8stesting.CreateAction)
			tr := createAction.GetObject().(*authnv1.TokenReview)

			switch tr.Spec.Token {
			case "admin-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: userAdmin,
					Groups:   []string{"system:masters", "system:authenticated"},
				}
			case "user0-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: userZero,
					Groups:   []string{"system:authenticated"},
				}
			case "user1-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: userOne,
					Groups:   []string{"system:authenticated"},
				}
			case "user2-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: userTwo,
					Groups:   []string{"system:authenticated"},
				}
			case "user3-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: userThree,
					Groups:   []string{"system:authenticated"},
				}
			case "user4-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: userFour,
					Groups:   []string{"system:authenticated"},
				}
			default:
				tr.Status.Authenticated = false
				tr.Status.Error = "unknown token"
			}

			return true, tr, nil
		},
	)
}

func mockAuthorization(clientset *fake.Clientset) {
	clientset.PrependReactor("create", "subjectaccessreviews",
		func(action k8stesting.Action) (handled bool, ret runtime.Object, err error) {

			createAction := action.(k8stesting.CreateAction)
			sar := createAction.GetObject().(*authv1.SubjectAccessReview)

			spec := sar.Spec
			sar.Status.Allowed = false
			// For users without full admin permissions to all namespaces, permission checks against
			// namespace resources return `NoOpinion`. Mock it here as a denial
			if spec.User != userAdmin && spec.ResourceAttributes.Resource == string(k8sProjectScope) {
				sar.Status.Denied = true
				sar.Status.Reason = "Cannot evaluate permission checks against namespaces"
				return true, sar, nil
			}

			switch spec.User {
			case userAdmin:
				sar.Status.Allowed = true
			case userZero:
				if spec.ResourceAttributes.Verb == string(k8sReadAction) &&
					spec.ResourceAttributes.Namespace == projectZero &&
					spec.ResourceAttributes.Resource != string(k8sGlobalDatasourceScope) {

					sar.Status.Allowed = true
				} else if spec.ResourceAttributes.Verb == string(k8sReadAction) &&
					spec.ResourceAttributes.Resource == string(k8sGlobalDatasourceScope) {

					sar.Status.Allowed = true
				} else {
					sar.Status.Reason = fmt.Sprintf("Mock RBAC: user0 cannot '%s' in namespace '%s", createAction.GetVerb(), createAction.GetNamespace())
				}
			case userOne:
				sar.Status.Allowed = false
				sar.Status.Reason = fmt.Sprintf("Mock RBAC: user1 cannot '%s'", createAction.GetVerb())
			case userTwo:
				if spec.ResourceAttributes.Verb == string(k8sReadAction) &&
					spec.ResourceAttributes.Resource != string(k8sGlobalDatasourceScope) {

					sar.Status.Allowed = true
				} else if spec.ResourceAttributes.Verb == string(k8sCreateAction) &&
					spec.ResourceAttributes.Namespace == projectZero {

					sar.Status.Allowed = true
					// user2 has incorrectly set up GlobalDatasource access to a single namespace. This should not be reflected
					// in any perses permissions
				} else if spec.ResourceAttributes.Verb == string(k8sReadAction) &&
					spec.ResourceAttributes.Namespace == projectZero &&
					spec.ResourceAttributes.Resource == string(k8sGlobalDatasourceScope) {

					sar.Status.Allowed = true
				}
			case userThree:
				if spec.ResourceAttributes.Verb == string(k8sReadAction) &&
					spec.ResourceAttributes.Resource == string(k8sGlobalDatasourceScope) {

					sar.Status.Allowed = true
				} else {
					sar.Status.Reason = fmt.Sprintf("Mock RBAC: user3 cannot '%s' on '%s'", spec.ResourceAttributes.Verb, spec.ResourceAttributes.Resource)
				}
			case userFour:
				if spec.ResourceAttributes.Verb == string(k8sReadAction) &&
					spec.ResourceAttributes.Resource == string(k8sDatasourceScope) &&
					spec.ResourceAttributes.Namespace == projectZero {

					sar.Status.Allowed = true
				} else {
					sar.Status.Reason = fmt.Sprintf("Mock RBAC: uer4 cannot '%s' on '%s'", spec.ResourceAttributes.Verb, spec.ResourceAttributes.Resource)
				}
			default:
				sar.Status.Reason = "Mock RBAC: User does not exist"
			}
			return true, sar, nil
		},
	)
}

func TestHasPermission(t *testing.T) {
	mockK8s := newK8sMock(t)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(""))
	rec := httptest.NewRecorder()

	testSuites := []struct {
		title          string
		user           string
		reqAction      v1Role.Action
		reqProject     string
		reqScope       v1Role.Scope
		expectedResult bool
	}{
		{
			title:          "admin has read dashboard perm in project0",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "admin has create dashboard perm in project0",
			user:           userAdmin,
			reqAction:      "create",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "admin has read dashboard perm in project1",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     projectOne,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user0 has read dashboard perm in project0",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user0 has read globaldatasource perm in project0",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "GlobalDatasource",
			expectedResult: true,
		},
		{
			title:          "user0 has read globaldatasource perm in project1",
			user:           userZero,
			reqAction:      "read",
			reqProject:     "project2",
			reqScope:       "GlobalDatasource",
			expectedResult: true,
		},
		{
			title:          "user0 has read globaldatasource perm in wildcard project",
			user:           userZero,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       "GlobalDatasource",
			expectedResult: true,
		},
		{
			title:          "user0 does have read project perm in project0",
			user:           userZero,
			reqAction:      "read",
			reqProject:     "project0",
			reqScope:       "Project",
			expectedResult: true,
		},
		{
			title:          "user0 does not have read project perm in project1",
			user:           userZero,
			reqAction:      "read",
			reqProject:     "project1",
			reqScope:       "Project",
			expectedResult: false,
		},
		{
			title:          "user0 doesn't have create dashboard perm in project0",
			user:           userZero,
			reqAction:      "create",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "user0 doesn't have read dashboard perm in project1",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectOne,
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "user1 doesn't have perms in project0",
			user:           userOne,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "user2 has read dashboard perm in project0",
			user:           userTwo,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user2 has read dashboard perm in project1",
			user:           userTwo,
			reqAction:      "read",
			reqProject:     projectOne,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user2 has create dashboard perm in project0",
			user:           userTwo,
			reqAction:      "create",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user2 doesn't have create dashboard perm in project1",
			user:           userTwo,
			reqAction:      "create",
			reqProject:     projectOne,
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "user2 doesn't have read globaldatasource perm in project0 due to invalid configuration",
			user:           userTwo,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "GlobalDatasource",
			expectedResult: false,
		},
		{
			title:          "user3 has read globaldatasource perm in wildcard project",
			user:           userThree,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       "GlobalDatasource",
			expectedResult: true,
		},
		{
			title:          "user3 doesn't have read dashboard perm in project0",
			user:           userThree,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "user4 has read datasource perm in project0",
			user:           userFour,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Datasource",
			expectedResult: true,
		},
		{
			title:          "user4 doesn't have read dashboard perm in project0",
			user:           userFour,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "user4 does have read project perm in project0",
			user:           userFour,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       "Project",
			expectedResult: true,
		},
		// Non-K8s scope tests: scopes without a CRD fall back to project/namespace permission checks.
		{
			title:          "admin has read variable perm in project0 (fallback to dashboard access)",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: true,
		},
		{
			title:          "admin has read globalvariable perm (fallback to dashboard access at cluster level)",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalVariableScope,
			expectedResult: true,
		},
		{
			title:          "user0 has read variable perm in project0 (fallback to dashboard access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user0 doesn't have read variable perm in project1 (fallback to dashboard access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectOne,
			reqScope:       v1Role.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user0 doesn't have create variable perm in project0 (fallback to dashboard access)",
			user:           userZero,
			reqAction:      "create",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user0 doesn't have read globalvariable perm (global scope, no wildcard dashboard access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalVariableScope,
			expectedResult: false,
		},
		{
			title:          "user1 doesn't have read variable perm in project0 (fallback to dashboard access)",
			user:           userOne,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user1 doesn't have read secret perm in project0 (checks k8s access)",
			user:           userOne,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.SecretScope,
			expectedResult: false,
		},
		{
			title:          "user2 has read variable perm in project0 (fallback to dashboard access)",
			user:           userTwo,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user2 has create variable perm in project0 (fallback to dashboard access)",
			user:           userTwo,
			reqAction:      "create",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: true,
		},
		{
			title:          "user2 doesn't have create variable perm in project1 (fallback to dashboard access)",
			user:           userTwo,
			reqAction:      "create",
			reqProject:     projectOne,
			reqScope:       v1Role.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user2 has read globalvariable perm (fallback to dashboard access, non-GlobalDatasource)",
			user:           userTwo,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalVariableScope,
			expectedResult: true,
		},
		{
			title:          "user3 doesn't have read variable perm in project0 (no namedashboardspace access)",
			user:           userThree,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: false,
		},
		{
			title:          "user3 doesn't have read globalvariable perm (no dashboard access at cluster level)",
			user:           userThree,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalVariableScope,
			expectedResult: false,
		},
		{
			title:          "user0 has read secret perm in project0 (checks k8s access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.SecretScope,
			expectedResult: true,
		},
		{
			title:          "user0 has read role perm in project0 (checks k8s access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.RoleScope,
			expectedResult: true,
		},
		{
			title:          "admin has read globalsecret perm (fallback to dashboard access at cluster level)",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalSecretScope,
			expectedResult: true,
		},
		{
			title:          "admin has read globalrole perm (fallback to dashboard access at cluster level)",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalRoleScope,
			expectedResult: true,
		},
		{
			title:          "admin has read rolebinding perm in project0 (fallback to dashboard access)",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.RoleBindingScope,
			expectedResult: true,
		},
		{
			title:          "admin has read globalrolebinding perm (fallback to dashboard access at cluster level)",
			user:           userAdmin,
			reqAction:      "read",
			reqProject:     "*",
			reqScope:       v1Role.GlobalRoleBindingScope,
			expectedResult: true,
		},
		{
			title:          "user0 has read folder perm in project0 (fallback to dashboard access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.FolderScope,
			expectedResult: true,
		},
		{
			title:          "user0 has read ephemeraldashboard perm in project0 (fallback to dashboard access)",
			user:           userZero,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.EphemeralDashboardScope,
			expectedResult: true,
		},
		{
			title:          "user4 doesn't have read variable perm (fallback to dashboard access)",
			user:           userFour,
			reqAction:      "read",
			reqProject:     projectZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: false,
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			req.Header.Set("Authorization", fmt.Sprintf("bearer %s-token", test.user))
			assert.Equal(t, test.expectedResult, mockK8s.HasPermission(e.NewContext(req, rec), test.reqAction, test.reqProject, test.reqScope))
		})
	}
}

func TestGetUserProjects(t *testing.T) {
	mockK8s := newK8sMock(t)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(""))
	rec := httptest.NewRecorder()

	testSuites := []struct {
		title          string
		user           string
		reqScope       v1Role.Scope
		expectedResult []string
	}{
		{
			title:          "admin has access to all projects",
			user:           userAdmin,
			reqScope:       v1Role.ProjectScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "user0 has access to project0",
			user:           userZero,
			reqScope:       v1Role.ProjectScope,
			expectedResult: []string{projectZero},
		},
		{
			title:          "user1 has access to no projects",
			user:           userOne,
			reqScope:       v1Role.ProjectScope,
			expectedResult: []string{},
		},
		{
			title:          "user2 has access to all projects",
			user:           userTwo,
			reqScope:       v1Role.ProjectScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "user3 has access to no projects",
			user:           userThree,
			reqScope:       v1Role.ProjectScope,
			expectedResult: []string{},
		},
		{
			title:          "user4 has access to project0",
			user:           userFour,
			reqScope:       v1Role.ProjectScope,
			expectedResult: []string{projectZero},
		},
		// Global scope tests: global resources are not tied to namespaces, so
		// GetUserProjects should return WildcardProject only if the user has
		// permission on the global scope. This prevents global resources from
		// being duplicated per namespace.
		{
			title:          "global scope GlobalDatasource returns wildcard for admin",
			user:           userAdmin,
			reqScope:       v1Role.GlobalDatasourceScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "global scope GlobalDatasource returns wildcard for user0 who has read access",
			user:           userZero,
			reqScope:       v1Role.GlobalDatasourceScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "global scope GlobalVariable returns wildcard for admin",
			user:           userAdmin,
			reqScope:       v1Role.GlobalVariableScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "global scope GlobalSecret returns wildcard for admin",
			user:           userAdmin,
			reqScope:       v1Role.GlobalSecretScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "global scope GlobalRole returns wildcard for admin",
			user:           userAdmin,
			reqScope:       v1Role.GlobalRoleScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "global scope GlobalRoleBinding returns wildcard for admin",
			user:           userAdmin,
			reqScope:       v1Role.GlobalRoleBindingScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "project scope Role returns all namespaces for admin (fallback to dashboard access)",
			user:           userAdmin,
			reqScope:       v1Role.RoleScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "project scope RoleBinding returns all namespaces for admin (fallback to dashboard access)",
			user:           userAdmin,
			reqScope:       v1Role.RoleBindingScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "global scope User returns wildcard for admin",
			user:           userAdmin,
			reqScope:       v1Role.UserScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "project scope Secret returns namespace list for admin",
			user:           userAdmin,
			reqScope:       v1Role.SecretScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "project scope Secret returns empty for user1",
			user:           userOne,
			reqScope:       v1Role.SecretScope,
			expectedResult: []string{},
		},
		// user3 has only GlobalDatasource access, no project-scoped permissions.
		{
			title:          "global scope GlobalDatasource returns wildcard for user3 who has read access",
			user:           userThree,
			reqScope:       v1Role.GlobalDatasourceScope,
			expectedResult: []string{"*"},
		},
		{
			title:          "project scope Dashboard returns empty for user3 who has no project access",
			user:           userThree,
			reqScope:       v1Role.DashboardScope,
			expectedResult: []string{},
		},
		// Project-scoped resources returns the per-namespace list.
		{
			title:          "project scope Dashboard still returns namespace list for admin",
			user:           userAdmin,
			reqScope:       v1Role.DashboardScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "project scope Datasource still returns namespace list for user0",
			user:           userZero,
			reqScope:       v1Role.DatasourceScope,
			expectedResult: []string{projectZero},
		},
		{
			title:          "project scope Datasource still returns namespace list for user4",
			user:           userFour,
			reqScope:       v1Role.DatasourceScope,
			expectedResult: []string{projectZero},
		},
		{
			title:          "project scope Dashboard returns empty for user4",
			user:           userFour,
			reqScope:       v1Role.DashboardScope,
			expectedResult: []string{},
		},
		// Non-K8s project-scoped resources fall back to namespace access for GetUserProjects
		{
			title:          "project scope Variable returns namespace list for user0 (fallback to dashboard access)",
			user:           userZero,
			reqScope:       v1Role.VariableScope,
			expectedResult: []string{projectZero},
		},
		{
			title:          "project scope Variable returns all namespaces for user2 (fallback to dashboard access)",
			user:           userTwo,
			reqScope:       v1Role.VariableScope,
			expectedResult: []string{"*", projectPerses, projectZero, projectOne},
		},
		{
			title:          "project scope Variable returns empty for user3 (no dashboard access)",
			user:           userThree,
			reqScope:       v1Role.VariableScope,
			expectedResult: []string{},
		},
		{
			title:          "project scope Variable returns empty list for user1 (no dashboard access)",
			user:           userOne,
			reqScope:       v1Role.VariableScope,
			expectedResult: []string{},
		},
		{
			title:          "project scope Variable returns empty for user4 (no dashboard access)",
			user:           userFour,
			reqScope:       v1Role.VariableScope,
			expectedResult: []string{},
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			req.Header.Set("Authorization", fmt.Sprintf("bearer %s-token", test.user))
			userProjects, err := mockK8s.GetUserProjects(e.NewContext(req, rec), v1Role.ReadAction, test.reqScope)
			assert.NoError(t, err)
			assert.Equal(t, test.expectedResult, userProjects)
		})
	}
}

func TestGetPermissions(t *testing.T) {
	mockK8s := newK8sMock(t)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(""))
	rec := httptest.NewRecorder()

	testSuites := []struct {
		title          string
		user           string
		expectedResult map[string][]*v1Role.Permission
	}{
		{
			title: "admin has full permissions to all projects",
			user:  userAdmin,
			expectedResult: map[string][]*v1Role.Permission{"*": {
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"Dashboard"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"Datasource"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"Secret"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"Variable"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"EphemeralDashboard"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"Folder"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"GlobalDatasource"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"GlobalVariable"}},
				{Actions: []v1Role.Action{"*"}, Scopes: []v1Role.Scope{"GlobalSecret"}},
			}},
		},
		{
			title: "user0 has readonly permissions in project0 and GlobalDatasource in all namespaces",
			user:  userZero,
			expectedResult: map[string][]*v1Role.Permission{"*": {
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"GlobalDatasource"}},
			}, projectZero: {
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Dashboard"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Datasource"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Secret"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Variable"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"EphemeralDashboard"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Folder"}},
			}},
		},
		{
			title:          "user1 has no permissions",
			user:           userOne,
			expectedResult: map[string][]*v1Role.Permission{},
		},
		{
			title: "user2 has read permissions in all namespaces and create permissions in project0",
			user:  userTwo,
			expectedResult: map[string][]*v1Role.Permission{"*": {
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Dashboard"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Datasource"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Secret"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Variable"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"EphemeralDashboard"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Folder"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"GlobalVariable"}},
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"GlobalSecret"}},
			}, projectZero: {
				{Actions: []v1Role.Action{"create"}, Scopes: []v1Role.Scope{"Dashboard"}},
				{Actions: []v1Role.Action{"create"}, Scopes: []v1Role.Scope{"Datasource"}},
				{Actions: []v1Role.Action{"create"}, Scopes: []v1Role.Scope{"Secret"}},
				{Actions: []v1Role.Action{"create"}, Scopes: []v1Role.Scope{"Variable"}},
				{Actions: []v1Role.Action{"create"}, Scopes: []v1Role.Scope{"EphemeralDashboard"}},
				{Actions: []v1Role.Action{"create"}, Scopes: []v1Role.Scope{"Folder"}},
			}},
		},
		{
			title: "user3 has only GlobalDatasource read permissions and no project-scoped permissions",
			user:  userThree,
			expectedResult: map[string][]*v1Role.Permission{"*": {
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"GlobalDatasource"}},
			}},
		},
		{
			title: "user4 has read datasource in project0",
			user:  userFour,
			expectedResult: map[string][]*v1Role.Permission{projectZero: {
				{Actions: []v1Role.Action{"read"}, Scopes: []v1Role.Scope{"Datasource"}},
			}},
		},
	}
	for i := range testSuites {
		test := testSuites[i]
		t.Run(test.title, func(t *testing.T) {
			req.Header.Set("Authorization", fmt.Sprintf("bearer %s-token", test.user))
			userPermissions, err := mockK8s.GetPermissions(e.NewContext(req, rec))
			assert.NoError(t, err)
			assert.Equal(t, test.expectedResult, userPermissions)
		})
	}
}
