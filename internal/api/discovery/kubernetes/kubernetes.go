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

package kubesd

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/common/async/taskhelper"
	"github.com/perses/perses/internal/api/discovery/cuetils"
	"github.com/perses/perses/internal/api/discovery/service"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/prometheus/common/model"
	"github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func buildLabelSelector(labels map[string]string) string {
	var builder strings.Builder
	for k, v := range labels {
		builder.WriteString(fmt.Sprintf("%s=%s,", k, v))
	}
	return builder.String()
}

type clientDiscovery interface {
	discover(decodedSchema []*cuetils.Node) ([]*v1.GlobalDatasource, error)
}

func NewDiscovery(discoveryName string, refreshInterval model.Duration, cfg *config.KubernetesDiscovery, svc *service.ApplyService, schemas schemas.Schemas) (taskhelper.Helper, error) {
	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("unable to get a kubeConfig: %w", err)
	}
	kubeClient, err := kubernetes.NewForConfig(kubeConfig)
	if err != nil {
		return nil, fmt.Errorf("unable to create the kube client: %w", err)
	}
	var d clientDiscovery
	if cfg.ServiceConfiguration.Enable {
		d = &serviceDiscovery{
			kubeClient:    kubeClient,
			cfg:           cfg.ServiceConfiguration,
			namespace:     cfg.Namespace,
			labelSelector: buildLabelSelector(cfg.Labels),
		}
	} else {
		d = &podDiscovery{
			kubeClient:    kubeClient,
			cfg:           cfg.PodConfiguration,
			namespace:     cfg.Namespace,
			labelSelector: buildLabelSelector(cfg.Labels),
		}
	}

	sd := &discovery{
		cfg:       cfg,
		svc:       svc,
		schemas:   schemas,
		name:      discoveryName,
		discovery: d,
	}
	return taskhelper.NewTick(sd, time.Duration(refreshInterval))
}

type discovery struct {
	async.SimpleTask
	cfg       *config.KubernetesDiscovery
	discovery clientDiscovery
	svc       *service.ApplyService
	schemas   schemas.Schemas
	name      string
}

func (d *discovery) Execute(_ context.Context, _ context.Context) error {
	decodedSchema, err := d.decodeSchema()
	if err != nil {
		logrus.WithError(err).Error("failed to decode schema")
		return nil
	}
	result, err := d.discovery.discover(decodedSchema)
	if err != nil {
		logrus.Errorf("failed to execute kube discovery %q: %v", d.name, err)
		return nil
	}
	d.svc.Apply(result)
	return nil
}

func (d *discovery) decodeSchema() ([]*cuetils.Node, error) {
	schema, err := d.schemas.GetDatasourceSchema(d.cfg.DatasourcePluginKind)
	if err != nil {
		logrus.WithError(err).Error("failed to get datasource schema")
		return nil, nil
	}
	return cuetils.NewFromSchema(schema)
}
