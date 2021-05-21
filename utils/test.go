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
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_, err := kv.Delete(ctx, "", clientv3.WithPrefix())
	if err != nil {
		t.Fatal(err)
	}
	for _, key := range keys {
		var count int64 = 1
		i := 0
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

func WaitUntilEntityIsCreate(t *testing.T, persistenceManager dependency.PersistenceManager, object interface{}) {
	var getFunc func(name string) (interface{}, error)
	var entityName string
	switch entity := object.(type) {
	case *v1.Project:
		entityName = entity.Metadata.Name
		getFunc = func(name string) (interface{}, error) {
			return persistenceManager.GetProject().Get(name)
		}
	case *v1.Datasource:
		entityName = entity.Metadata.Name
		getFunc = func(name string) (interface{}, error) {
			return persistenceManager.GetDatasource().Get(name)
		}
	case *v1.User:
		entityName = entity.Metadata.Name
		getFunc = func(name string) (interface{}, error) {
			return persistenceManager.GetUser().Get(name)
		}
	default:
		t.Fatalf("%T is not managed", object)
	}
	// we can have some delay between the order to create the document and the actual creation. so let's wait sometimes
	i := 0
	for _, err := getFunc(entityName); err != nil && i < 30; _, err = getFunc(entityName) {
		i++
		time.Sleep(2 * time.Second)
	}
}

func NewProject() *v1.Project {
	return &v1.Project{
		Kind: v1.KindProject,
		Metadata: v1.Metadata{
			Name: "perses",
		}}
}

func NewDatasource(t *testing.T) *v1.Datasource {
	promURL, err := url.Parse("https://prometheus.demo.do.prometheus.io")
	if err != nil {

		t.Fatal(err)
	}
	return &v1.Datasource{
		Kind: v1.KindDatasource,
		Metadata: v1.Metadata{
			Name: "PrometheusDemo",
		},
		Spec: v1.DatasourceSpec{URL: promURL},
	}
}

func NewUser() *v1.User {
	return &v1.User{
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
