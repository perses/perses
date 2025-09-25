// Copyright 2025 The Perses Authors
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

package whoami

import (
	"fmt"

	"github.com/perses/perses/internal/api/impl/auth"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/client/api"
)

type k8sWhoami struct {
	apiClient api.ClientInterface
}

func (n *k8sWhoami) Whoami() (string, error) {
	result := &auth.ExternalUserInfoProfile{}

	res := n.apiClient.RESTClient().Get().
		APIVersion("").
		Resource(fmt.Sprintf("/%s/providers/%s/%s", utils.PathAuth, utils.AuthKindKubernetes, utils.PathWhoami)).
		Do()

	if err := res.Error(); err != nil {
		return "", err
	}
	err := res.Object(result)
	if err != nil {
		return "", err
	}

	return result.Name, nil
}
