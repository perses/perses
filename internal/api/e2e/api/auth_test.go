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

package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/dependency"
	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/config"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"
)

func TestAuth(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usrEntity := e2eframework.NewUser("foo", "password")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: usrEntity.Spec.NativeProvider.Password,
		}

		jsonToken := expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusOK).
			JSON()
		jsonToken.Path("$.access_token").NotNull().NotEqual("")
		jsonToken.Path("$.refresh_token").NotNull().NotEqual("")
		return []modelAPI.Entity{usrEntity}
	})
}

func TestAuth_EmptyPassword(t *testing.T) {
	e2eframework.WithServerConfig(t, e2eframework.DefaultAuthConfig(), func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usrEntity := e2eframework.NewUser("foo", "password")
		expect.POST(fmt.Sprintf("%s/%s", utils.APIV1Prefix, utils.PathUser)).
			WithJSON(usrEntity).
			Expect().
			Status(http.StatusOK)

		authEntity := modelAPI.Auth{
			Login:    usrEntity.GetMetadata().GetName(),
			Password: "",
		}

		expect.POST(fmt.Sprintf("%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindNative, utils.PathLogin)).
			WithJSON(authEntity).
			Expect().
			Status(http.StatusBadRequest)
		return []modelAPI.Entity{usrEntity}
	})
}

// TestAuth_OAuthProvider_AuthEndpoint
// Send a GET request to the /login endpoint of the provider, in order to be redirected.
// So we expect just a 200 status with a fake body proving that it comes from the test provider.
func TestAuth_OAuthProvider_AuthEndpoint(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathLogin)).
			Expect().
			Status(http.StatusOK).
			Body().IsEqual("Provider's Auth Endpoint")
		return nil
	})
}

// TestAuth_OAuthProvider_AuthEndpoint
// Send a GET request to the /login endpoint of the provider, in order to be redirected.
// So we expect just a 200 status with a fake body proving that it comes from the test provider.
func TestAuth_OIDCProvider_AuthEndpoint(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathLogin)).
			Expect().
			Status(http.StatusOK).
			Body().IsEqual("Provider's Auth Endpoint")
		return nil
	})
}

// TestAuth_OAuthProvider_CallbackEndpoint
// Send a GET request to the /callback endpoint of the provider.
// Unfortunately, we cannot verify the nominal case because state cookie secret cannot be guessed.
// It's generated on start of the Perses backend.
func TestAuth_OAuthProvider_CallbackEndpoint(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		// Callback expect some inputs. If they're not given, the server return an error.
		expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathCallback)).
			Expect().
			// TODO: This might need a Bad Request error instead of Internal Server Error.
			//  As OIDC lib return 401, it would be good to align with that.
			Status(http.StatusInternalServerError)

		//TODO: We cannot test the /callback endpoint nominal case because state cookie secret cannot be guessed.
		//  It's generated on start of the Perses backend.
		//expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathCallback)).
		//	WithQuery("code", "ohMyCode").
		//	WithCookie("state", "b2hNeVN0YXRlCg==").
		//	Expect().
		//	Status(http.StatusOK)
		return nil
	})
}

// TestAuth_OAuthProvider_CallbackEndpoint
// Send a GET request to the /callback endpoint of the provider.
// Unfortunately, we cannot verify the nominal case because state cookie secret cannot be guessed.
// It's generated on start of the Perses backend.
func TestAuth_OIDCProvider_CallbackEndpoint(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		// Callback expect some inputs. If they're not given, the server return an error.
		expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathCallback)).
			Expect().
			// Failing to read state cookie, OIDC lib return a 401
			Status(http.StatusUnauthorized)

		//TODO: We cannot test the /callback endpoint nominal case because state cookie secret cannot be guessed.
		//  It's generated on start of the Perses backend.
		//expect.GET(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathCallback)).
		//	WithQuery("code", "ohMyCode").
		//	WithCookie("state", "b2hNeVN0YXRlCg==").
		//	Expect().
		//	Status(http.StatusOK)
		return nil
	})
}

// TestAuth_OAuthProvider_DeviceCode
// Test the generation of a device auth response from the provider.
// This is the data that will be used
// - on one hand by the user to go to the login page (user code + verification_uri)
// - on the other hand by the CLI to poll the /token endpoint to know when the user logged in (device code)
func TestAuth_OAuthProvider_DeviceCode(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathDeviceCode)).
			Expect().
			Status(http.StatusOK).
			JSON().
			IsEqual(oauth2.DeviceAuthResponse{
				DeviceCode:      "myCode",
				UserCode:        "myUser",
				VerificationURI: "myURL",
			})
		return nil
	})
}

// TestAuth_OIDCProvider_DeviceCode
// Test the generation of a device auth response from the provider.
// This is the data that will be used
// - on one hand by the user to go to the login page (user code + verification_uri)
// - on the other hand by the CLI to poll the /token endpoint to know when the user logged in (device code)
func TestAuth_OIDCProvider_DeviceCode(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathDeviceCode)).
			Expect().
			Status(http.StatusOK).
			JSON().
			IsEqual(oidc.DeviceAuthorizationResponse{
				DeviceCode:      "myCode",
				UserCode:        "myUser",
				VerificationURI: "myURL",
			})
		return nil
	})
}

// TestAuth_OAuthProvider_Token_FromDeviceCode
// Test one of the two ways to get a valid Perses session with OAuth provider.
// It uses device code and send it to the provider.
// It uses as well the userinfo endpoint to sync the user.
func TestAuth_OAuthProvider_Token_FromDeviceCode(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("john.doe", ""),
		}

		jsonToken := expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathToken)).
			WithFormField("grant_type", modelAPI.GrantTypeDeviceCode).
			WithFormField("device_code", "myCode").
			Expect().
			Status(http.StatusOK).
			JSON()
		jsonToken.Path("$.access_token").NotNull()
		jsonToken.Path("$.refresh_token").NotNull()
		return usersCreatedByTheSuite
	})
}

// TestAuth_OIDCProvider_Token_FromDeviceCode
// Test one of the two ways to get a valid Perses session with OAuth provider.
// It uses device code and send it to the provider.
// It uses as well the userinfo endpoint to sync the user.
func TestAuth_OIDCProvider_Token_FromDeviceCode(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("john.doeOIDC", ""),
		}

		jsonToken := expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathToken)).
			WithFormField("grant_type", modelAPI.GrantTypeDeviceCode).
			WithFormField("device_code", "myCode").
			Expect().
			Status(http.StatusOK).
			JSON()
		jsonToken.Path("$.access_token").NotNull()
		jsonToken.Path("$.refresh_token").NotNull()
		return usersCreatedByTheSuite
	})
}

// TestAuth_OAuthProvider_Token_FromDeviceCode
// Test one of the two ways to get a valid Perses session with OAuth provider.
// It uses client credentials and send them to the provider.
// It uses as well the userinfo endpoint to sync the user.
func TestAuth_OAuthProvider_Token_FromClientCredentials(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("john.doe", ""),
		}

		expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathToken)).
			WithFormField("grant_type", modelAPI.GrantTypeClientCredentials).
			Expect().
			Status(http.StatusBadRequest) // No authorization passed

		jsonToken := expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathToken)).
			WithFormField("grant_type", modelAPI.GrantTypeClientCredentials).
			WithHeader("Authorization", "Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQK"). // echo "client-id:client-secret" | base64
			Expect().
			Status(http.StatusOK).
			JSON()
		jsonToken.Path("$.access_token").NotNull()
		jsonToken.Path("$.refresh_token").NotNull()
		return usersCreatedByTheSuite
	})
}

// TestAuth_OAuthProvider_Token_FromDeviceCode
// Test one of the two ways to get a valid Perses session with OAuth provider.
// It uses client credentials and send them to the provider.
// It uses as well the userinfo endpoint to sync the user.
func TestAuth_OIDCProvider_Token_FromClientCredentials(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	e2eframework.WithServerConfig(t, conf, func(_ *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("client-id-oidc", ""),
		}

		expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathToken)).
			WithFormField("grant_type", modelAPI.GrantTypeClientCredentials).
			Expect().
			Status(http.StatusBadRequest) // No authorization passed

		jsonToken := expect.POST(fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathToken)).
			WithFormField("grant_type", modelAPI.GrantTypeClientCredentials).
			WithHeader("Authorization", "Basic Y2xpZW50LWlkLW9pZGM6Y2xpZW50LXNlY3JldAo="). // echo "client-id-oidc:client-secret" | base64
			Expect().
			Status(http.StatusOK).
			JSON()
		jsonToken.Path("$.access_token").NotNull()
		jsonToken.Path("$.refresh_token").NotNull()
		return usersCreatedByTheSuite
	})
}

// TestAuth_OAuthProvider_Token_WithLib
// Test the client credentials mechanism using the golang oauth2 library.
func TestAuth_OAuthProvider_Token_WithLib(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	// Server with oauth provider configured.
	e2eframework.WithServerConfig(t, conf, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("john.doe", ""),
		}

		persesBaseURL := common.MustParseURL(server.URL)
		unauthenticatedClient, err := config.NewRESTClient(config.RestConfigClient{
			URL: persesBaseURL,
		})
		assert.NoError(t, err)
		persesTokenURL := common.MustParseURL(server.URL)
		persesTokenURL.Path = fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathToken)

		authenticatedClient, err := config.NewRESTClient(config.RestConfigClient{
			URL: persesBaseURL,
			OAuth: &secret.OAuth{
				ClientID:     "MyClientID",     // Can be anything as our provider is very permissive
				ClientSecret: "MyClientSecret", // Can be anything as our provider is very permissive
				TokenURL:     persesTokenURL.String(),
				AuthStyle:    int(oauth2.AuthStyleInHeader),
			},
		})
		assert.NoError(t, err)

		// => Nominal case: The perses backend has the /token endpoint and the client have the client credentials.
		_, err = v1.NewWithClient(authenticatedClient).Project().List("")
		assert.NoError(t, err)

		// => Error case: The client doesn't have the client credentials.
		_, err = v1.NewWithClient(unauthenticatedClient).Project().List("")
		assert.ErrorContains(t, err, "missing or malformed jwt StatusCode: 401")

		return usersCreatedByTheSuite
	})

	// Server without oauth provider configured.
	e2eframework.WithServer(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		persesBaseURL := common.MustParseURL(server.URL)
		persesTokenURL := common.MustParseURL(server.URL)
		persesTokenURL.Path = fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathToken)
		authenticatedClient, err := config.NewRESTClient(config.RestConfigClient{
			URL: persesBaseURL,
			OAuth: &secret.OAuth{
				ClientID:     "MyClientID",     // Can be anything as our provider is very permissive
				ClientSecret: "MyClientSecret", // Can be anything as our provider is very permissive
				TokenURL:     persesTokenURL.String(),
				AuthStyle:    int(oauth2.AuthStyleInHeader),
			},
		})
		assert.NoError(t, err)

		_, err = v1.NewWithClient(authenticatedClient).Project().List("")

		// => Error case: The perses backend doesn't have the /token endpoint.
		assert.ErrorContains(t, err, "oauth2: cannot fetch token: 405 Method Not Allowed")

		return nil
	})
}

// TestAuth_OIDCProvider_Token_WithLib
// Test the client credentials mechanism using the golang oauth2 library.
func TestAuth_OIDCProvider_Token_WithLib(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	// Server with OIDC provider configured.
	e2eframework.WithServerConfig(t, conf, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("MyClientID", ""),
		}

		persesBaseURL := common.MustParseURL(server.URL)
		unauthenticatedClient, err := config.NewRESTClient(config.RestConfigClient{
			URL: persesBaseURL,
		})
		assert.NoError(t, err)

		persesTokenURL := common.MustParseURL(server.URL)
		persesTokenURL.Path = fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOIDC, providerConfig.SlugID, utils.PathToken)
		authenticatedClient, err := config.NewRESTClient(config.RestConfigClient{
			URL: persesBaseURL,
			OAuth: &secret.OAuth{
				ClientID:     "MyClientID",     // Can be anything as our provider is very permissive
				ClientSecret: "MyClientSecret", // Can be anything as our provider is very permissive
				TokenURL:     persesTokenURL.String(),
				AuthStyle:    int(oauth2.AuthStyleInHeader),
			},
		})
		assert.NoError(t, err)

		// => Nominal case: The perses backend has the /token endpoint and the client have the client credentials.
		_, err = v1.NewWithClient(authenticatedClient).Project().List("")
		assert.NoError(t, err)

		// => Error case: The client doesn't have the client credentials.
		_, err = v1.NewWithClient(unauthenticatedClient).Project().List("")
		assert.ErrorContains(t, err, "missing or malformed jwt StatusCode: 401")

		return usersCreatedByTheSuite
	})

	// Server without OIDC provider configured.
	e2eframework.WithServer(t, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		persesBaseURL := common.MustParseURL(server.URL)
		persesTokenURL := common.MustParseURL(server.URL)
		persesTokenURL.Path = fmt.Sprintf("%s/%s/%s/%s/%s", utils.APIPrefix, utils.PathAuthProviders, utils.AuthKindOAuth, providerConfig.SlugID, utils.PathToken)
		authenticatedClient, err := config.NewRESTClient(config.RestConfigClient{
			OAuth: &secret.OAuth{
				ClientID:     "MyClientID",     // Can be anything as our provider is very permissive
				ClientSecret: "MyClientSecret", // Can be anything as our provider is very permissive
				TokenURL:     persesTokenURL.String(),
				AuthStyle:    int(oauth2.AuthStyleInHeader),
			},
			URL: persesBaseURL,
		})
		assert.NoError(t, err)

		_, err = v1.NewWithClient(authenticatedClient).Project().List("")

		// => Error case: The perses backend doesn't have the /token endpoint.
		assert.ErrorContains(t, err, "oauth2: cannot fetch token: 405 Method Not Allowed")

		return nil
	})
}
