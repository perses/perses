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

package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	userInterface "github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

type fakeUserDAO struct {
	user   *v1.User
	getArg string
}

func (d *fakeUserDAO) Create(_ *v1.User) error {
	return nil
}

func (d *fakeUserDAO) Update(_ *v1.User) error {
	return nil
}

func (d *fakeUserDAO) Delete(_ string) error {
	return nil
}

func (d *fakeUserDAO) Get(name string) (*v1.User, error) {
	d.getArg = name
	return d.user, nil
}

func (d *fakeUserDAO) List(_ *userInterface.Query) ([]*v1.User, error) {
	return nil, nil
}

func (d *fakeUserDAO) MetadataList(_ *userInterface.Query) ([]api.Entity, error) {
	return nil, nil
}

func (d *fakeUserDAO) RawMetadataList(_ *userInterface.Query) ([]json.RawMessage, error) {
	return nil, nil
}

type fakeJWT struct {
	logins []string
}

func (j *fakeJWT) SignedAccessToken(login string, _ crypto.ProviderInfo, _ map[string][]string) (string, error) {
	j.logins = append(j.logins, login)
	return "access-token", nil
}

func (j *fakeJWT) SignedRefreshToken(login string, _ crypto.ProviderInfo, _ map[string][]string) (string, error) {
	j.logins = append(j.logins, login)
	return "refresh-token", nil
}

func (j *fakeJWT) CreateAccessTokenCookie(_ string) (*http.Cookie, *http.Cookie) {
	return &http.Cookie{}, &http.Cookie{}
}

func (j *fakeJWT) DeleteAccessTokenCookie() (*http.Cookie, *http.Cookie) {
	return &http.Cookie{}, &http.Cookie{}
}

func (j *fakeJWT) CreateRefreshTokenCookie(_ string) *http.Cookie {
	return &http.Cookie{}
}

func (j *fakeJWT) DeleteRefreshTokenCookie() *http.Cookie {
	return &http.Cookie{}
}

func (j *fakeJWT) CreateOIDCTokenCookie(_ *oauth2.Token) *http.Cookie {
	return &http.Cookie{}
}

func (j *fakeJWT) DeleteOIDCTokenCookie() *http.Cookie {
	return &http.Cookie{}
}

func (j *fakeJWT) CreateOIDCRefreshTokenCookie(_ string) *http.Cookie {
	return &http.Cookie{}
}

func (j *fakeJWT) DeleteOIDCRefreshTokenCookie() *http.Cookie {
	return &http.Cookie{}
}

func (j *fakeJWT) ValidateRefreshToken(_ string) (*crypto.JWTClaims, error) {
	return nil, nil
}

func (j *fakeJWT) GetExpiresIn() int64 {
	return 3600
}

func TestNativeAuthUsesStoredLogin(t *testing.T) {
	password, err := crypto.HashAndSalt([]byte("password"))
	require.NoError(t, err)

	usr := &v1.User{
		Kind:     v1.KindUser,
		Metadata: *v1.NewMetadata("alice"),
		Spec: v1.UserSpec{
			NativeProvider: v1.NativeProvider{Password: string(password)},
		},
	}
	dao := &fakeUserDAO{user: usr}
	jwt := &fakeJWT{}
	endpoint := &nativeEndpoint{
		dao:             dao,
		jwt:             jwt,
		tokenManagement: tokenManagement{jwt: jwt},
	}

	body := `{"login":"Alice","password":"password"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()

	err = endpoint.auth(echo.New().NewContext(req, rec))
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	// The lookup uses the login as typed (case-insensitive database), but the tokens must use the stored login.
	assert.Equal(t, "Alice", dao.getArg)
	require.Len(t, jwt.logins, 2)
	assert.Equal(t, "alice", jwt.logins[0])
	assert.Equal(t, "alice", jwt.logins[1])
}
