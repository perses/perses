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

//go:build integration

package e2eframework

import (
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/go-jose/go-jose/v4"
	"github.com/google/uuid"
	"github.com/perses/perses/internal/api/core"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/dependency"
	"github.com/perses/perses/internal/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/stretchr/testify/assert"
	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"
)

var useSQL = os.Getenv("PERSES_TEST_USE_SQL")

func DefaultConfig() apiConfig.Config {
	projectPath := test.GetRepositoryPath()
	return apiConfig.Config{
		Security: apiConfig.Security{
			Readonly:      false,
			EnableAuth:    false,
			Authorization: apiConfig.AuthorizationConfig{},
			Authentication: apiConfig.AuthenticationConfig{
				AccessTokenTTL:  common.Duration(apiConfig.DefaultAccessTokenTTL),
				RefreshTokenTTL: common.Duration(apiConfig.DefaultRefreshTokenTTL),
				Providers:       apiConfig.AuthProviders{EnableNative: true},
			},
			EncryptionKey: secret.Hidden(hex.EncodeToString([]byte("=tW$56zytgB&3jN2E%7-+qrGZE?v6LCc"))),
		},
		EphemeralDashboard: apiConfig.EphemeralDashboard{
			Enable: true,
		},
		Plugin: apiConfig.Plugin{
			Path:        filepath.Join(projectPath, "plugins"),
			ArchivePath: filepath.Join(projectPath, "plugins-archive"),
		},
	}
}

func DefaultAuthConfig() apiConfig.Config {
	conf := DefaultConfig()
	conf.Security.EnableAuth = true
	conf.Security.Cookie = apiConfig.Cookie{
		SameSite: apiConfig.SameSite(http.SameSiteNoneMode),
		Secure:   true,
	}
	conf.Security.Authorization = apiConfig.AuthorizationConfig{GuestPermissions: []*role.Permission{
		{
			Actions: []role.Action{role.ReadAction},
			Scopes:  []role.Scope{role.WildcardScope},
		},
		{
			Actions: []role.Action{role.CreateAction},
			Scopes:  []role.Scope{role.ProjectScope},
		},
	},
		Providers: apiConfig.AuthorizationProviders{
			EnableNative: true,
		},
	}
	return conf
}

func ClearAllKeys(t *testing.T, dao databaseModel.DAO, entities ...modelAPI.Entity) {
	for _, entity := range entities {
		err := dao.Delete(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
		if err != nil {
			t.Fatal(err)
		}
	}
}

func defaultFileConfig() *apiConfig.File {
	return &apiConfig.File{
		Folder:        "./test",
		Extension:     apiConfig.JSONExtension,
		CaseSensitive: true,
	}
}

func CreateServer(t *testing.T, conf apiConfig.Config) (*httptest.Server, *httpexpect.Expect, dependency.PersistenceManager) {
	if useSQL == "true" {
		conf.Database = apiConfig.Database{
			SQL: &apiConfig.SQL{
				User:                 "user",
				Password:             "password",
				Net:                  "tcp",
				Addr:                 "localhost:3306",
				DBName:               "perses",
				AllowNativePasswords: true,
				CaseSensitive:        true,
			},
		}
	} else {
		conf.Database = apiConfig.Database{
			File: defaultFileConfig(),
		}
	}
	registerer := prometheus.NewRegistry()
	runner, persistenceManager, err := core.New(conf, false, registerer, "")
	if err != nil {
		t.Fatal(err)
	}
	handler, err := runner.HTTPServerBuilder().BuildHandler()
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(handler)
	return server, httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	}), persistenceManager
}

func WithServer(t *testing.T, testFunc func(*httptest.Server, *httpexpect.Expect, dependency.PersistenceManager) []modelAPI.Entity) {
	conf := DefaultConfig()
	server, expect, persistenceManager := CreateServer(t, conf)
	defer persistenceManager.GetPersesDAO().Close()
	defer server.Close()
	entities := testFunc(server, expect, persistenceManager)
	ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)
}

func WithServerConfig(t *testing.T, config apiConfig.Config, testFunc func(*httptest.Server, *httpexpect.Expect, dependency.PersistenceManager) []modelAPI.Entity) {
	server, expect, persistenceManager := CreateServer(t, config)
	defer persistenceManager.GetPersesDAO().Close()
	defer server.Close()
	entities := testFunc(server, expect, persistenceManager)
	ClearAllKeys(t, persistenceManager.GetPersesDAO(), entities...)
}

// NewOAuthProviderTestServer creates a new OAuth provider server that will be used to test the OAuth login.
// It returns the HTTP test server and the configuration of the OAuth provider to request it.
//
// - The slug ID is generated randomly, so we are sure that it is unique, but it has no incidence on the provider server.
// It can be overridden for convenience before starting the Perses backend.
// - The returned server is a simple HTTP test server that will return a mocked response for each endpoint.
// Currently, this is only OK responses, but we can easily extend it to return more complex responses from given
// constructor parameters.
func NewOAuthProviderTestServer(t *testing.T) (*httptest.Server, apiConfig.OAuthProvider) {
	authPath := "/auth"
	deviceAuthPath := "/device"
	tokenPath := "/token"
	userInfosPath := "/user_infos"

	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if strings.HasPrefix(request.RequestURI, authPath) {
			_, err := writer.Write([]byte("Provider's Auth Endpoint"))
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, deviceAuthPath) {
			body, err := json.Marshal(oauth2.DeviceAuthResponse{
				DeviceCode:      "myCode",
				UserCode:        "myUser",
				VerificationURI: "myURL",
			})
			assert.NoError(t, err)
			writer.Header().Set("Content-Type", "application/json")
			_, err = writer.Write(body)
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, tokenPath) {
			body, err := json.Marshal(oauth2.Token{
				AccessToken:  "myToken",
				TokenType:    "myTokenType",
				RefreshToken: "myRefreshToken",
				Expiry:       time.Now().Add(4 * time.Hour),
			})
			assert.NoError(t, err)
			writer.Header().Set("Content-Type", "application/json")
			_, err = writer.Write(body)
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, userInfosPath) {
			writer.Header().Set("Content-Type", "application/json")
			_, err := writer.Write([]byte(`{"email": "john.doe@gmail.com"}`)) // minimum of an email required
			assert.NoError(t, err)
			return
		}
		// If something else is asked, it is considered as an error
		t.Fatalf("An unexpected oauth provider endpoint has been called : %s", request.RequestURI)
	}))

	authURL := common.MustParseURL(server.URL)
	authURL.Path = authPath
	deviceAuthURL := common.MustParseURL(server.URL)
	deviceAuthURL.Path = deviceAuthPath
	tokenURL := common.MustParseURL(server.URL)
	tokenURL.Path = tokenPath
	userInfosURL := common.MustParseURL(server.URL)
	userInfosURL.Path = userInfosPath

	id := uuid.New().String() // Generate a unique slug ID in case we register several ones.
	conf := apiConfig.OAuthProvider{
		Provider: apiConfig.Provider{
			SlugID:       id,
			Name:         id,
			ClientID:     "unused but required",
			ClientSecret: "unused but required",
			RedirectURI:  common.URL{},
		},
		AuthURL:       *authURL,
		TokenURL:      *tokenURL,
		UserInfosURL:  *userInfosURL,
		DeviceAuthURL: *deviceAuthURL,
	}

	return server, conf
}

// NewOIDCProviderTestServer creates a new OAuth provider server that will be used to test the OAuth login.
// It returns the HTTP test server and the configuration of the OAuth provider to request it.
//
// - The slug ID is generated randomly, so we are sure that it is unique, but it has no incidence on the provider server.
// It can be overridden for convenience before starting the Perses backend.
// - The returned server is a simple HTTP test server that will return a mocked response for each endpoint.
// Currently, this is only OK responses, but we can easily extend it to return more complex responses from given
// constructor parameters.
func NewOIDCProviderTestServer(t *testing.T) (*httptest.Server, apiConfig.OIDCProvider) {
	authPath := "/auth"
	deviceAuthPath := "/device"
	tokenPath := "/token"
	userInfosPath := "/user_infos"
	jwksPath := "/keys"
	discoveryPath := "/.well-known/openid-configuration"
	discoveryConfig := &oidc.DiscoveryConfiguration{}

	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if strings.HasPrefix(request.RequestURI, discoveryPath) {
			body, err := json.Marshal(discoveryConfig)
			assert.NoError(t, err)
			writer.Header().Set("Content-Type", "application/json")
			_, err = writer.Write(body)
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, authPath) {
			_, err := writer.Write([]byte("Provider's Auth Endpoint"))
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, deviceAuthPath) {
			body, err := json.Marshal(oauth2.DeviceAuthResponse{
				DeviceCode:      "myCode",
				UserCode:        "myUser",
				VerificationURI: "myURL",
			})
			assert.NoError(t, err)
			writer.Header().Set("Content-Type", "application/json")
			_, err = writer.Write(body)
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, tokenPath) {
			accessToken, _ := ValidAccessToken(discoveryConfig.Issuer)
			idToken, _ := ValidIDToken(discoveryConfig.Issuer)
			body, err := json.Marshal(oidc.AccessTokenResponse{
				AccessToken: accessToken,
				TokenType:   "Bearer",
				IDToken:     idToken,
				ExpiresIn:   250,
			})
			assert.NoError(t, err)
			writer.Header().Set("Content-Type", "application/json")
			_, err = writer.Write(body)
			assert.NoError(t, err)
			return
		}
		if strings.HasPrefix(request.RequestURI, userInfosPath) {
			writer.Header().Set("Content-Type", "application/json")
			_, err := writer.Write([]byte(`{"sub": "john.doeOIDC"}`))
			assert.NoError(t, err)
			return
		}

		if strings.HasPrefix(request.RequestURI, jwksPath) {
			body, err := json.Marshal(jose.JSONWebKeySet{Keys: []jose.JSONWebKey{WebKey.Public()}})
			assert.NoError(t, err)
			writer.Header().Set("Content-Type", "application/json")
			_, err = writer.Write(body)
			assert.NoError(t, err)
			return
		}
		// If something else is asked, it is considered as an error
		t.Fatalf("An unexpected OIDC provider endpoint has been called : %s", request.RequestURI)
	}))

	authURL := common.MustParseURL(server.URL)
	authURL.Path = authPath
	deviceAuthURL := common.MustParseURL(server.URL)
	deviceAuthURL.Path = deviceAuthPath
	tokenURL := common.MustParseURL(server.URL)
	tokenURL.Path = tokenPath
	userInfosURL := common.MustParseURL(server.URL)
	userInfosURL.Path = userInfosPath
	jwksURL := common.MustParseURL(server.URL)
	jwksURL.Path = jwksPath
	discoveryConfig.Issuer = server.URL
	discoveryConfig.AuthorizationEndpoint = authURL.String()
	discoveryConfig.DeviceAuthorizationEndpoint = deviceAuthURL.String()
	discoveryConfig.TokenEndpoint = tokenURL.String()
	discoveryConfig.UserinfoEndpoint = userInfosURL.String()
	discoveryConfig.JwksURI = jwksURL.String()

	id := uuid.New().String() // Generate a unique slug ID in case we register several ones.
	conf := apiConfig.OIDCProvider{
		Provider: apiConfig.Provider{
			SlugID:       id,
			Name:         id,
			ClientID:     "clientID",
			ClientSecret: "clientSecret",
			RedirectURI:  common.URL{},
		},
		Issuer: *common.MustParseURL(server.URL),
	}

	return server, conf
}
