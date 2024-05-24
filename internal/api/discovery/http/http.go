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

package httpsd

import (
	"context"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/common/async/taskhelper"
	"github.com/perses/perses/internal/api/discovery/service"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func NewDiscovery(cfg *config.HTTPDiscovery, svc *service.ApplyService) (taskhelper.Helper, error) {
	client, err := perseshttp.NewFromConfig(cfg.RestConfigClient)
	if err != nil {
		return nil, err
	}
	sd := &discovery{
		restClient: client,
		svc:        svc,
		name:       cfg.Name,
	}
	return taskhelper.NewTick(sd, time.Duration(cfg.RefreshInterval))
}

type discovery struct {
	async.SimpleTask
	restClient *perseshttp.RESTClient
	svc        *service.ApplyService
	name       string
}

func (d *discovery) Execute(_ context.Context, _ context.Context) error {
	var result []*v1.GlobalDatasource
	err := d.restClient.Get().
		Do().
		Object(&result)

	if err != nil {
		logrus.Errorf("failed to execute http discovery %q: %v", d.name, err)
		return nil
	}
	d.svc.Apply(result)
	return nil
}
