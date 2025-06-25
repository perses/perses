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

package crypto

import (
	"testing"

	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	modelV1Secret "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/stretchr/testify/assert"
)

func TestEncryptDecryptUsingCFB(t *testing.T) {
	crypto, _, err := New(config.Security{
		EncryptionKey: "3d74572435367a797467372d2b7172475a453f76364c4363",
	})
	spec := &modelV1.SecretSpec{
		BasicAuth: &modelV1Secret.BasicAuth{
			Password: "password123",
		},
	}
	assert.NoError(t, err)
	assert.NotEmpty(t, spec.BasicAuth.Password)
	// this is just an encrypted string of password123 which I printed out on runtime. ONLY for testing purpose
	cfbEncryptedPassword := "Bm11iHDx3AL966MEKBjQrL_AN8pzFqnRtluw" //nolint: gosec
	spec.BasicAuth.Password = cfbEncryptedPassword

	err = crypto.Decrypt(spec)
	assert.NoError(t, err)
	assert.Equal(t, crypto.IsCFBEncrypted(), true)
	assert.Equal(t, spec.BasicAuth.Password, "password123")
}

func TestEncryptDecryptUsingAES(t *testing.T) {
	crypto, _, err := New(config.Security{
		EncryptionKey: "3d74572435367a797467372d2b7172475a453f76364c4363",
	})
	spec := &modelV1.SecretSpec{
		BasicAuth: &modelV1Secret.BasicAuth{
			Password: "password123",
		},
	}
	assert.NoError(t, err)
	assert.NotEmpty(t, spec.BasicAuth.Password)
	err = crypto.Encrypt(spec)
	assert.NoError(t, err)
	assert.NotEmpty(t, spec.BasicAuth.Password)
	assert.NotEqual(t, spec.BasicAuth.Password, "password123")

	err = crypto.Decrypt(spec)
	assert.NoError(t, err)
	assert.Equal(t, crypto.IsCFBEncrypted(), false)
	assert.Equal(t, spec.BasicAuth.Password, "password123")
}
