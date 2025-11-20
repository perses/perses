// Copyright 2025 The Perses Authors
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
	"github.com/perses/perses/pkg/model/api/v1/role"
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

	assert.NoError(t, createNamespace(clientset, "perses"))
	assert.NoError(t, createNamespace(clientset, "test"))

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

func mockAuthentication(clientset *fake.Clientset) {
	clientset.PrependReactor("create", "tokenreviews",
		func(action k8stesting.Action) (handled bool, ret runtime.Object, err error) {

			createAction := action.(k8stesting.CreateAction)
			tr := createAction.GetObject().(*authnv1.TokenReview)

			switch tr.Spec.Token {
			case "admin-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: "admin",
					Groups:   []string{"system:masters", "system:authenticated"},
				}
			case "user0-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: "user0",
					Groups:   []string{"system:authenticated"},
				}
			case "user1-token":
				tr.Status.Authenticated = true
				tr.Status.User = authnv1.UserInfo{
					Username: "user1",
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
			if spec.User == "admin" {
				sar.Status.Allowed = true
				// User0 has access to read in project0 only
			} else if spec.User == "user0" && spec.ResourceAttributes.Verb == "get" && spec.ResourceAttributes.Namespace == "project0" {
				sar.Status.Allowed = true
			} else if spec.User == "user0" {
				sar.Status.Allowed = false
				sar.Status.Reason = fmt.Sprintf("Mock RBAC: user0 cannot '%s' in namespace '%s", createAction.GetVerb(), createAction.GetNamespace())
			} else if spec.User == "user1" {
				sar.Status.Allowed = false
				sar.Status.Reason = fmt.Sprintf("Mock RBAC: user1 cannot '%s'", createAction.GetVerb())
			} else {
				sar.Status.Allowed = false
				sar.Status.Reason = "Mock RBAC: User does not exist"
			}

			return true, sar, nil
		},
	)
}

func TestCacheHasPermission(t *testing.T) {
	mockK8s := newK8sMock(t)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(""))
	rec := httptest.NewRecorder()

	testSuites := []struct {
		title          string
		user           string
		reqAction      role.Action
		reqProject     string
		reqScope       role.Scope
		expectedResult bool
	}{
		{
			title:          "user1 doesn't have perms in project0",
			user:           "user1",
			reqAction:      "read",
			reqProject:     "project0",
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "admin has read dashboard perm in project0",
			user:           "admin",
			reqAction:      "read",
			reqProject:     "project0",
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user0 has read dashboard perm in project0",
			user:           "user0",
			reqAction:      "read",
			reqProject:     "project0",
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "admin has create dashboard perm in project0",
			user:           "admin",
			reqAction:      "create",
			reqProject:     "project0",
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user0 doesn't have create dashboard perm in project0",
			user:           "user0",
			reqAction:      "create",
			reqProject:     "project0",
			reqScope:       "Dashboard",
			expectedResult: false,
		},
		{
			title:          "admin has read dashboard perm in project1",
			user:           "admin",
			reqAction:      "read",
			reqProject:     "project1",
			reqScope:       "Dashboard",
			expectedResult: true,
		},
		{
			title:          "user0 doesn't have read dashboard perm in project1",
			user:           "user0",
			reqAction:      "read",
			reqProject:     "project1",
			reqScope:       "Dashboard",
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
