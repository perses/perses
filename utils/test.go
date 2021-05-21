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

package utils

import (
	"context"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	configUtils "github.com/perses/common/config"
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	clientv3 "go.etcd.io/etcd/client/v3"
)

// DatabaseLocker should be used to be sure that only one test is modifying or accessing the database
// It should avoid concurrent delete of object in the database
var DatabaseLocker = &sync.Mutex{}

func ClearAllKeys(t *testing.T, client *clientv3.Client, keys ...string) {
	kv := clientv3.NewKV(client)
	for _, key := range keys {
		var count int64 = 1
		i := 0
		_, err := kv.Delete(context.Background(), key)
		if err != nil {
			t.Fatal(err)
		}
		for count > 0 && i < 30 {
			gr, err := kv.Get(context.Background(), key)
			if err != nil {
				t.Fatal(err)
			}
			count = gr.Count
			if count > 0 {
				time.Sleep(2 * time.Second)
			}
			i++
		}
		if i >= 30 && count > 0 {
			t.Fatal("database is not correctly cleanup to be able to move to the next test")
		}
	}
}

func CreateAndWaitUntilEntityExists(t *testing.T, persistenceManager dependency.PersistenceManager, object interface{}) {
	var getFunc func() (interface{}, error)
	var upsertFunc func() error
	switch entity := object.(type) {
	case *v1.Project:
		getFunc = func() (interface{}, error) {
			return persistenceManager.GetProject().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetProject().Update(entity)
		}
	case *v1.Datasource:
		getFunc = func() (interface{}, error) {
			return persistenceManager.GetDatasource().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetDatasource().Update(entity)
		}
	case *v1.User:
		getFunc = func() (interface{}, error) {
			return persistenceManager.GetUser().Get(entity.Metadata.Name)
		}
		upsertFunc = func() error {
			return persistenceManager.GetUser().Update(entity)
		}
	default:
		t.Fatalf("%T is not managed", object)
	}

	// it appears that (maybe because of the tiny short between a delete order and a create order),
	// an entity actually created in database could be removed by a previous delete order.
	// In order to avoid that we will upsert the entity multiple times.
	// Also we can have some delay between the order to create the document and the actual creation. so let's wait sometimes
	nbTimeToCreate := 3
	for i := 0; i < nbTimeToCreate; i++ {
		if err := upsertFunc(); err != nil {
			t.Fatal(err)
		}
		j := 0
		var err error
		for _, err = getFunc(); err != nil && j < 30; _, err = getFunc() {
			j++
			time.Sleep(2 * time.Second)
		}
		if err != nil {
			t.Fatal(err)
		}
	}

}

func NewProject() *v1.Project {
	entity := &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: "perses",
		}}
	entity.Metadata.CreateNow()
	return entity
}

func NewDatasource(t *testing.T) *v1.Datasource {
	promURL, err := url.Parse("https://prometheus.demo.do.prometheus.io")
	if err != nil {

		t.Fatal(err)
	}
	entity := &v1.Datasource{
		Kind: v1.KindDatasource,
		Metadata: v1.Metadata{
			Name: "PrometheusDemo",
		},
		Spec: v1.DatasourceSpec{URL: promURL},
	}
	entity.Metadata.CreateNow()
	return entity
}

func NewUser() *v1.User {
	entity := &v1.User{
		Kind: v1.KindUser,
		Metadata: v1.Metadata{
			Name: "jdoe",
		},
		Spec: v1.UserSpec{
			FirstName: "John",
			LastName:  "Doe",
			Password:  []byte("password"),
		},
	}
	entity.Metadata.CreateNow()
	return entity
}

func DefaultETCDConfig() *configUtils.EtcdConfig {
	return &configUtils.EtcdConfig{
		Connections: []configUtils.Connection{
			{
				Host: "localhost",
				Port: 2379,
			},
		},
		Protocol:              configUtils.EtcdAsHTTPProtocol,
		RequestTimeoutSeconds: 10,
	}
}

func CreateServer(t *testing.T) (*httptest.Server, dependency.PersistenceManager, *clientv3.Client) {
	handler := echo.New()
	etcdClient, err := etcd.NewETCDClient(*DefaultETCDConfig())
	if err != nil {
		t.Fatal(err)
	}
	persistenceManager, err := dependency.NewPersistenceManager(config.Database{
		Etcd: DefaultETCDConfig(),
	})
	if err != nil {
		t.Fatal(err)
	}
	serviceManager := dependency.NewServiceManager(persistenceManager)
	persesAPI := core.NewPersesAPI(serviceManager)
	persesAPI.RegisterRoute(handler)
	return httptest.NewServer(handler), persistenceManager, etcdClient
}
