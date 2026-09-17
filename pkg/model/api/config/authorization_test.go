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

package config

import (
	"testing"
	"time"

	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/assert"
)

func TestKubernetesAuthorizationProvider_VerifyDefaults(t *testing.T) {
	k := &KubernetesAuthorizationProvider{Enable: true}
	assert.NoError(t, k.Verify())
	assert.Equal(t, 500, k.QPS)
	assert.Equal(t, 1000, k.Burst)
	assert.Equal(t, common.Duration(DefaultKubernetesAuthenticationTTL), k.AuthenticatorTTL)
	assert.Equal(t, common.Duration(DefaultKubernetesAuthorizationAllowTTL), k.AuthorizerAllowTTL)
	assert.Equal(t, common.Duration(DefaultKubernetesAuthorizationDenyTTL), k.AuthorizerDenyTTL)
}

func TestKubernetesAuthorizationProvider_VerifyKeepsExplicitDenyTTL(t *testing.T) {
	k := &KubernetesAuthorizationProvider{Enable: true, AuthorizerDenyTTL: common.Duration(time.Minute)}
	assert.NoError(t, k.Verify())
	assert.Equal(t, common.Duration(time.Minute), k.AuthorizerDenyTTL)
}
