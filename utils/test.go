// +build integration

package utils

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/common/config"
	"github.com/perses/perses/internal/api/core"
	"github.com/perses/perses/internal/api/shared/dependency"
	"go.etcd.io/etcd/clientv3"
)

func ClearAllKeys(t *testing.T, client *clientv3.Client) {
	kv := clientv3.NewKV(client)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_, err := kv.Delete(ctx, "", clientv3.WithPrefix())
	if err != nil {
		t.Fatal(err)
	}
}

func DefaultETCDConfig() config.EtcdConfig {
	return config.EtcdConfig{
		Connections: []config.Connection{
			{
				Host: "localhost",
				Port: 2379,
			},
		},
		Protocol:              config.EtcdAsHTTPProtocol,
		RequestTimeoutSeconds: 10,
	}
}

func CreateServer(t *testing.T) (*httptest.Server, dependency.PersistenceManager) {
	handler := echo.New()
	persistenceManager, err := dependency.NewPersistenceManager(DefaultETCDConfig())
	if err != nil {
		t.Fatal(err)
	}
	serviceManager := dependency.NewServiceManager(persistenceManager)
	persesAPI := core.NewPersesAPI(serviceManager)
	persesAPI.RegisterRoute(handler)
	return httptest.NewServer(handler), persistenceManager
}
