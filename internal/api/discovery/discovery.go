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

package discovery

import (
	"github.com/perses/common/async/taskhelper"
	"github.com/perses/perses/internal/api/dependency"
	httpsd "github.com/perses/perses/internal/api/discovery/http"
	kubesd "github.com/perses/perses/internal/api/discovery/kubernetes"
	"github.com/perses/perses/internal/api/discovery/service"
	"github.com/perses/perses/pkg/model/api/config"
)

func New(cfg config.Config, serviceManager dependency.ServiceManager, caseSensitive bool) ([]taskhelper.Helper, error) {
	var helpers []taskhelper.Helper
	svc := service.New(caseSensitive, serviceManager.GetGlobalDatasource())
	for _, c := range cfg.GlobalDatasourceDiscovery {
		var helper taskhelper.Helper
		var err error
		if c.HTTPDiscovery != nil {
			helper, err = httpsd.NewDiscovery(c.DiscoveryName, c.RefreshInterval, c.HTTPDiscovery, svc)
		} else if c.KubernetesDiscovery != nil {
			helper, err = kubesd.NewDiscovery(c.DiscoveryName, c.RefreshInterval, c.KubernetesDiscovery, svc, serviceManager.GetSchemas())
		}
		if err != nil {
			return nil, err
		}
		helpers = append(helpers, helper)
	}
	return helpers, nil
}
