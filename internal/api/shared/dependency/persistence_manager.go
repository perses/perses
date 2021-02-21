package dependency

import (
	"time"

	"github.com/perses/common/config"
	"github.com/perses/common/etcd"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"go.etcd.io/etcd/clientv3"
)

type PersistenceManager interface {
	GetProject() project.DAO
	GetETCDClient() *clientv3.Client
}

type persistence struct {
	PersistenceManager
	project    project.DAO
	etcdClient *clientv3.Client
}

func NewPersistenceManager(conf config.EtcdConfig) (PersistenceManager, error) {
	timeout := time.Duration(conf.RequestTimeoutSeconds) * time.Second
	etcdClient, err := etcd.NewETCDClient(conf)
	if err != nil {
		return nil, err
	}
	projectDAO := projectImpl.NewDAO(etcdClient, timeout)
	return &persistence{
		project: projectDAO,
	}, nil
}

func (p *persistence) GetProject() project.DAO {
	return p.project
}

func (p *persistence) GetETCDClient() *clientv3.Client {
	return p.etcdClient
}
