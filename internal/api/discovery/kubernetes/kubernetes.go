// Copyright The Perses Authors
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
	"sort"
	"strings"
	"time"

	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/common/async"
	"github.com/perses/common/async/taskhelper"
	"github.com/perses/perses/internal/api/discovery/cuetils"
	"github.com/perses/perses/internal/api/discovery/service"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/common"
	"github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func buildLabelSelector(labels map[string]string) string {
	var builder []string
	for k, v := range labels {
		if v == "" {
			builder = append(builder, k)
		} else {
			builder = append(builder, fmt.Sprintf("%s=%s", k, v))
		}
	}
	// We sort the labels to have a deterministic order.
	sort.Strings(builder)
	return strings.Join(builder, ",")
}

// discoveredDatasource pairs a converted GlobalDatasource with the raw Kubernetes
// labels and annotations from the originating resource, so that default
// resolution can filter within the already-fetched set without a second API call.
type discoveredDatasource struct {
	datasource  *v1.GlobalDatasource
	labels      map[string]string
	annotations map[string]string
}

type clientDiscovery interface {
	discover(decodedSchema []*cuetils.Node) ([]*discoveredDatasource, error)
}

func NewDiscovery(discoveryName string, refreshInterval common.Duration, cfg *config.KubernetesDiscovery, svc *service.ApplyService, schema schema.Schema) (taskhelper.Helper, error) {
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
		cfg:        cfg,
		svc:        svc,
		schema:     schema,
		name:       discoveryName,
		discovery:  d,
		kubeClient: kubeClient,
	}
	return taskhelper.NewTick(sd, time.Duration(refreshInterval))
}

type discovery struct {
	async.SimpleTask
	cfg        *config.KubernetesDiscovery
	discovery  clientDiscovery
	svc        *service.ApplyService
	schema     schema.Schema
	name       string
	kubeClient kubernetes.Interface
}

func (d *discovery) Execute(_ context.Context, _ context.CancelFunc) error {
	decodedSchema, err := d.decodeSchema()
	if err != nil {
		logrus.WithError(err).Error("failed to decode schema")
		return nil
	}
	resources, err := d.discovery.discover(decodedSchema)
	if err != nil {
		logrus.Errorf("failed to execute kube discovery %q: %v", d.name, err)
		return nil
	}
	defaultName, err := d.resolveDefaultName()
	if err != nil {
		logrus.WithError(err).Errorf("failed to resolve default datasource for kube discovery %q", d.name)
		return nil
	}
	var entities []*v1.GlobalDatasource
	for _, r := range resources {
		entities = append(entities, r.datasource)
	}
	d.svc.Apply(entities, defaultName)
	return nil
}

// resolveDefaultName returns the generated name (namespace.name) of the first Kubernetes resource
// matching Default.Labels and Default.Annotations, or empty string if Default.Enable is false or no match is found.
func (d *discovery) resolveDefaultName() (string, error) {
	if !d.cfg.Default.Enable {
		return "", nil
	}
	labelSelector := buildLabelSelector(d.cfg.Default.Labels)
	if d.cfg.ServiceConfiguration.Enable {
		response, err := d.kubeClient.CoreV1().Services(d.cfg.Namespace).List(context.Background(), metav1.ListOptions{LabelSelector: labelSelector})
		if err != nil {
			return "", err
		}
		for _, svc := range response.Items {
			if matchesAnnotations(svc.Annotations, d.cfg.Default.Annotations) {
				return fmt.Sprintf("%s.%s", svc.Namespace, svc.Name), nil
			}
		}
	} else {
		response, err := d.kubeClient.CoreV1().Pods(d.cfg.Namespace).List(context.Background(), metav1.ListOptions{LabelSelector: labelSelector})
		if err != nil {
			return "", err
		}
		for _, pod := range response.Items {
			if matchesAnnotations(pod.Annotations, d.cfg.Default.Annotations) {
				return fmt.Sprintf("%s.%s", pod.Namespace, pod.Name), nil
			}
		}
	}
	return "", nil
}

// matchesAnnotations returns true if all key/value pairs in required are present in actual.
func matchesAnnotations(actual, required map[string]string) bool {
	for k, v := range required {
		if actual[k] != v {
			return false
		}
	}
	return true
}

func (d *discovery) String() string {
	return fmt.Sprintf("datasource discovery %q", d.name)
}

func (d *discovery) decodeSchema() ([]*cuetils.Node, error) {
	sch, err := d.schema.GetDatasourceSchema(d.cfg.DatasourcePluginKind)
	if err != nil {
		logrus.WithError(err).Error("failed to get datasource schema")
		return nil, nil
	}
	ctx := cuecontext.New()
	return cuetils.NewFromSchema(ctx.BuildInstance(sch))
}
