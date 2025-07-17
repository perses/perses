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
	defaultCacheInterval                   = time.Second * 30
	DefaultKubernetesAuthorizationAllowTTL = time.Minute * 5
	DefaultKubernetesAuthorizationDenyTTL  = time.Second * 30
	DefaultKubernetesAuthenticationTTL     = time.Minute * 2
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
	QPS int `json:"qps,omitempty" yaml:"qps,omitempty"`
	// burst QPS the k8s client will use with the apiserver. Default: 1000 qps
	Burst int `json:"burst,omitempty" yaml:"burst,omitempty"`
	// time an authorizer allow response will be cached for. Default: 5m
	AuthorizerAllowTTL common.Duration `json:"authorizer_allow_ttl,omitempty" yaml:"authorizer_allow_ttl,omitempty"`
	// time an authorizer denied will be cached for. Default: 30s
	AuthorizerDenyTTL common.Duration `json:"authorizer_deny_ttl,omitempty" yaml:"authorizer_deny_ttl,omitempty"`
	// time an authenticator response will be cached for. Default: 2m
	AuthenticatorTTL common.Duration `json:"authenticator_ttl,omitempty" yaml:"authenticator_ttl,omitempty"`
}

func (k *KubernetesProvider) Verify() error {
	if !k.Enable {
		return nil
	}
	if k.Kubeconfig != "" {
		logrus.Warn("kubeconfig present, this functionality should not be used in production")
	}
	if k.QPS == 0 {
		k.QPS = 500
	}
	if k.Burst == 0 {
		k.Burst = 1000
	}
	if k.AuthenticatorTTL == 0 {
		k.AuthenticatorTTL = common.Duration(DefaultKubernetesAuthenticationTTL)
	}
	if k.AuthorizerAllowTTL == 0 {
		k.AuthorizerAllowTTL = common.Duration(DefaultKubernetesAuthorizationAllowTTL)
	}
	if k.AuthenticatorTTL == 0 {
		k.AuthorizerDenyTTL = common.Duration(DefaultKubernetesAuthorizationDenyTTL)
	}
	return nil
}

type NativeAuthorizationProvider struct {
	Enable bool `json:"enable,omitempty" yaml:"enable,omitempty"`
	// CheckLatestUpdateInterval that checks if the RBAC cache needs to be refreshed with db content. Only for SQL database setup.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// Default permissions for guest users (logged-in users)
	GuestPermissions []*role.Permission `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
}

func (n *NativeAuthorizationProvider) Verify() error {
	if !n.Enable {
		return nil
	}
	if n.CheckLatestUpdateInterval <= 0 {
		n.CheckLatestUpdateInterval = common.Duration(defaultCacheInterval)
	}
	if n.GuestPermissions == nil {
		n.GuestPermissions = []*role.Permission{}
	}
	return nil
}

type AuthorizationProvider struct {
	Kubernetes KubernetesProvider          `json:"kubernetes,omitzero" yaml:"kubernetes,omitempty"`
	Native     NativeAuthorizationProvider `json:"native,omitzero" yaml:"native,omitempty"`
}

type AuthorizationConfig struct {
	// DEPRECATED: use NativeAuthorizationProvider.CheckLatestUpdateInterval instead.
	CheckLatestUpdateInterval common.Duration `json:"check_latest_update_interval,omitempty" yaml:"check_latest_update_interval,omitempty"`
	// DEPRECATED: use NativeAuthorizationProvider.GuestPermissions instead.
	GuestPermissions []*role.Permission    `json:"guest_permissions,omitempty" yaml:"guest_permissions,omitempty"`
	Provider         AuthorizationProvider `json:"provider,omitzero" yaml:"provider,omitempty"`
}

func (a *AuthorizationConfig) Verify() error {
	if a.CheckLatestUpdateInterval > 0 {
		logrus.Warn("'security.authorization.check_latest_update_interval' is deprecated, use 'security.authorization.provider.native.check_latest_update_interval' instead.")
		a.Provider.Native.CheckLatestUpdateInterval = a.CheckLatestUpdateInterval
		a.CheckLatestUpdateInterval = 0
	}
	if len(a.GuestPermissions) > 0 {
		logrus.Warn("'security.authorization.guest_permissions' is deprecated, use 'security.authorization.provider.native.guest_permissions' instead.")
		a.Provider.Native.GuestPermissions = a.GuestPermissions
		a.GuestPermissions = nil
	}
	return nil
}
