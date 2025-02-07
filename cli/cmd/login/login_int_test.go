// Copyright 2024 The Perses Authors
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

package login

import (
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/api/dependency"
	e2eframework "github.com/perses/perses/api/e2e/framework"
	cmdTest "github.com/perses/perses/cli/test"
	modelAPI "github.com/perses/perses/pkg/model/api"
)

func TestLoginOAuth(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOAuthProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OAuth = append(conf.Security.Authentication.Providers.OAuth, providerConfig)

	// Server with oauth provider configured.
	e2eframework.WithServerConfig(t, conf, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			//TODO: At the difference with the OIDC flow, we don't use the client id as username, but query /userinfos
			//  with provider's token. (in this case returning john.doe like the other flow)
			//  This is not clear yet which one is the right way.
			//  - On one hand, client credentials are not meant for users so /userinfos should return nothing
			//  - On the other hand, putting client id as username can be misleading(/unsecure?) for some providers.
			//    For example azure advise to use object id to identify a Azure Application in a relying party tool like Perses.
			//e2eframework.NewUser("anything"),
			e2eframework.NewUser("john.doe", "password"),
		}
		testSuite := []cmdTest.Suite{{
			Title: "Nominal Device Code flow",
			Args:  []string{"--provider", providerConfig.SlugID, server.URL},
			// The message contain the wait as well as the success.
			// It is because the fake authentication provider that we setup will always return good token
			ExpectedMessage: fmt.Sprintf(`Go to myURL and enter this user code: myUser
Waiting for user to authorize the application...
successfully logged in %s
`, server.URL),
			IsErrorExpected: false,
		}, {
			Title: "Nominal Client Credentials flow",
			// Fake provider will accept any client id/secret
			Args:            []string{"--provider", providerConfig.SlugID, "--client-id", "anything", "--client-secret", "anything", server.URL},
			ExpectedMessage: fmt.Sprintf("successfully logged in %s\n", server.URL),
			IsErrorExpected: false,
		}}
		cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
		return usersCreatedByTheSuite
	})
}

func TestLoginOIDC(t *testing.T) {
	providerServer, providerConfig := e2eframework.NewOIDCProviderTestServer(t)
	defer providerServer.Close()

	conf := e2eframework.DefaultAuthConfig()
	conf.Security.Authentication.Providers.OIDC = append(conf.Security.Authentication.Providers.OIDC, providerConfig)

	// Server with oauth provider configured.
	e2eframework.WithServerConfig(t, conf, func(server *httptest.Server, expect *httpexpect.Expect, manager dependency.PersistenceManager) []modelAPI.Entity {
		usersCreatedByTheSuite := []modelAPI.Entity{
			e2eframework.NewUser("anything", "password"),
			e2eframework.NewUser("john.doeOIDC", "password"),
		}
		testSuite := []cmdTest.Suite{{
			Title: "Nominal Device Code flow",
			Args:  []string{"--provider", providerConfig.SlugID, server.URL},
			// The message contain the wait as well as the success.
			// It is because the fake authentication provider that we setup will always return good token
			ExpectedMessage: fmt.Sprintf(`Go to myURL and enter this user code: myUser
Waiting for user to authorize the application...
successfully logged in %s
`, server.URL),
			IsErrorExpected: false,
		}, {
			Title: "Nominal Client Credentials flow",
			// Fake provider will accept any client id/secret
			Args:            []string{"--provider", providerConfig.SlugID, "--client-id", "anything", "--client-secret", "anything", server.URL},
			ExpectedMessage: fmt.Sprintf("successfully logged in %s\n", server.URL),
			IsErrorExpected: false,
		}}
		cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
		return usersCreatedByTheSuite
	})
}
