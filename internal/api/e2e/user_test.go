// Copyright 2021 Amadeus s.a.s
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

// +build integration

package e2e

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/gavv/httpexpect/v2"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/utils"
	"github.com/stretchr/testify/assert"
)

func TestCreateUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	// perform the POST request, no error should occur at this point
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathUser)).
		WithJSON(entity).
		Expect().
		Status(http.StatusOK)

	// check the document exists in the db
	_, err := persistenceManager.GetUser().Get(entity.Metadata.Name)
	assert.NoError(t, err)
	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestCreateUserWithConflict(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	// recall the same endpoint, it should now return a conflict error
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathUser)).
		WithJSON(entity).
		Expect().
		Status(http.StatusConflict)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestCreateUserBadRequest(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	user := &v1.User{Kind: v1.KindUser}

	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// metadata.name is not provided, it should return a bad request
	e.POST(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathUser)).
		WithJSON(user).
		Expect().
		Status(http.StatusBadRequest)
}

func TestUpdateUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()

	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	// call now the update endpoint, shouldn't return an error
	o := e.PUT(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathUser, entity.Metadata.Name)).
		WithJSON(entity).
		Expect().
		Status(http.StatusOK).
		JSON().Raw()

	// To be able to compare the result, an easy is to convert the map returned by the test framework.
	// So for that we have to first marshal again the data
	raw, err := json.Marshal(o)
	if err != nil {
		t.Fatal(err)
	}
	result := &v1.User{}
	if err := json.Unmarshal(raw, result); err != nil {
		t.Fatal(err)
	}

	// for the moment the only thing to test is that the dates are correctly updated
	assert.True(t, result.Metadata.CreatedAt.UnixNano() < result.Metadata.UpdatedAt.UnixNano())

	// check the document exists in the db
	_, err = persistenceManager.GetUser().Get(entity.Metadata.Name)
	assert.NoError(t, err)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestUpdateUserNotFound(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, _, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.PUT(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathUser, entity.Metadata.Name)).
		WithJSON(entity).
		Expect().
		Status(http.StatusNotFound)

	utils.ClearAllKeys(t, etcdClient)
}

func TestUpdateUserBadRequest(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	// the name in the metadata and the name in the path doesn't match, it should return a bad request
	e.PUT(fmt.Sprintf("%s/%s/otherUser", shared.APIV1Prefix, shared.PathUser)).
		WithJSON(entity).
		Expect().
		Status(http.StatusBadRequest)
}

func TestGetUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	e.GET(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathUser, entity.Metadata.Name)).
		Expect().
		Status(http.StatusOK)

	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}

func TestGetUserNotFound(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.GET(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathUser)).
		Expect().
		Status(http.StatusNotFound)
}

func TestDeleteUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, persistenceManager, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	e.DELETE(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathUser, entity.Metadata.Name)).
		Expect().
		Status(http.StatusNoContent)

	e.GET(fmt.Sprintf("%s/%s/%s", shared.APIV1Prefix, shared.PathUser, entity.Metadata.Name)).
		Expect().
		Status(http.StatusNotFound)
}

func TestDeleteUserNotFound(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	server, _, _ := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.DELETE(fmt.Sprintf("%s/%s/perses", shared.APIV1Prefix, shared.PathUser)).
		Expect().
		Status(http.StatusNotFound)
}

func TestListUser(t *testing.T) {
	utils.DatabaseLocker.Lock()
	utils.DatabaseLocker.Unlock()
	entity := utils.NewUser()
	server, persistenceManager, etcdClient := utils.CreateServer(t)
	defer server.Close()
	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  server.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})
	utils.CreateAndWaitUntilEntityExists(t, persistenceManager, entity)

	e.GET(fmt.Sprintf("%s/%s", shared.APIV1Prefix, shared.PathUser)).
		Expect().
		Status(http.StatusOK)
	utils.ClearAllKeys(t, etcdClient, entity.GenerateID())
}
