// Copyright 2021 The Perses Authors
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

package database

import (
	"fmt"
	"time"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/config"
)

type DAO interface {
	Create(key string, entity interface{}) error
	Upsert(key string, entity interface{}) error
	Get(key string, entity interface{}) error
	Query(query etcd.Query, slice interface{}) error
	Delete(key string) error
	HealthCheck() bool
}

func New(conf config.Database) (DAO, error) {
	if conf.Etcd != nil {
		timeout := time.Duration(conf.Etcd.RequestTimeoutSeconds) * time.Second
		etcdClient, err := etcd.NewETCDClient(*conf.Etcd)
		if err != nil {
			return nil, err
		}
		return etcd.NewDAO(etcdClient, timeout), nil
	}
	if conf.File != nil {
		return &fileDAO{
			folder:    conf.File.Folder,
			extension: conf.File.FileExtension,
		}, nil
	}
	return nil, fmt.Errorf("no dao defined")
}
