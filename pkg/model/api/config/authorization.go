// Copyright 2023 The Perses Authors
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

package config

import (
	"time"

	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

var (
	defaultCacheInterval = 30 * time.Second
)

type KubernetesProvider struct {
	Enable bool `json:"enable,omitempty" yaml:"enable,omitempty"`
	// File path to a local kubeconfig file used for local testing/development. The current logged in
	// user's bearer token will be used for both the backend and as the user being logged into Perses.
	// The user should have "create" permissions for the `TokenReview` and `SubjectAccessReview`
	// resources. If this parameter isn't available the pods service account token will be used. This
	// parameter should not be set in production
	Kubeconfig string `json:"kubeconfig,omitempty" yaml:"kubeconfig,omitempty"`
	// query per second (QPS) the k8s client will use with the apiserver. Default: 500 qps
	QPS float32 `json:"qps,omitempty" yaml:"qps,omitempty"`
	// burst QPS the k8s client will use with the apiserver. Default: 1000 qps
	Burst float32 `json:"burst,omitempty" yaml:"burst,omitempty"`
}

type AuthorizationProviders struct {
	Kubernetes KubernetesProvider `json:"kubernetes,omitzero" yaml:"kubernetes,omitempty"`
}

type AuthorizationConfig struct {
	// CheckLatestUpdateInterval that checks if the RBAC cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*role.Permission     `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
	Providers        AuthorizationProviders `json:"providers,omitzero" yaml:"providers,omitempty"`
}

func (a *AuthorizationConfig) Verify() error {
	if a.CheckLatestUpdateInterval <= 0 {
		a.CheckLatestUpdateInterval = common.Duration(defaultCacheInterval)
	}
	if a.GuestPermissions == nil {
		a.GuestPermissions = []*role.Permission{}
	}
	return nil
}

func (p *KubernetesProvider) Verify() error {
	if p.Kubeconfig != "" {
		logrus.Warnln("kubeconfig present, this functionality should not be used in production")
	}
	return nil
}
