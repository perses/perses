// +build integration

package core

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/common/config"
	"github.com/perses/perses/internal/api/shared/dependency"
	"go.etcd.io/etcd/clientv3"
)

func clearAllKeys(t *testing.T, client *clientv3.Client) {
	kv := clientv3.NewKV(client)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_, err := kv.Delete(ctx, "", clientv3.WithPrefix())
	if err != nil {
		t.Fatal(err)
	}
}

func defaultETCDConfig() config.EtcdConfig {
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

func createServer(t *testing.T) (*httptest.Server, dependency.PersistenceManager) {
	handler := echo.New()
	persistenceManager, err := dependency.NewPersistenceManager(defaultETCDConfig())
	if err != nil {
		t.Fatal(err)
	}
	serviceManager := dependency.NewServiceManager(persistenceManager)
	persesAPI := NewPersesAPI(serviceManager)
	persesAPI.RegisterRoute(handler)
	return httptest.NewServer(handler), persistenceManager
}
