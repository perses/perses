package project

import (
	"time"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/project"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"go.etcd.io/etcd/clientv3"
)

type dao struct {
	project.DAO
	client etcd.DAO
}

func NewDAO(etcdClient *clientv3.Client, timeout time.Duration) project.DAO {
	client := etcd.NewDAO(etcdClient, timeout)
	return &dao{
		client: client,
	}
}

func (d *dao) Create(entity *v1.Project) error {
	key := entity.GenerateID()
	return d.client.Create(key, entity)
}
