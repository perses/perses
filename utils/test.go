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
	"sync"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	configUtils "github.com/perses/common/config"
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/shared/dependency"
	"github.com/perses/perses/internal/config"
	clientv3 "go.etcd.io/etcd/client/v3"
)

// DatabaseLocker should be used to be sure that only one test is modifying or accessing the database
// It should avoid concurrent delete of object in the database
var DatabaseLocker = &sync.Mutex{}

func ClearAllKeys(t *testing.T, client *clientv3.Client) {
	kv := clientv3.NewKV(client)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_, err := kv.Delete(ctx, "", clientv3.WithPrefix())
	if err != nil {
		t.Fatal(err)
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
