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

package refresh

import (
	"fmt"

	"github.com/perses/perses/internal/cli/cmd/login"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/pkg/client/api"
)

type k8sRefresh struct {
	apiClient api.ClientInterface
}

func (k *k8sRefresh) refresh() error {
	// If the k8sAuth secret hasn't been set yet then we know that the user hasn't attempted to log in
	if config.Global.RestClientConfig.K8sAuth == nil {
		return fmt.Errorf("kubeconfig location has not been set yet, please use the command login to set it")
	}

	k8sRefresh := login.NewK8sLogin(k.apiClient, config.Global.RestClientConfig.K8sAuth.KubeconfigFile)

	_, err := k8sRefresh.Refresh()
	if err != nil {
		return err
	}

	return nil
}
