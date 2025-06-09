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
	cfbEncryptedPassword := "Bm11iHDx3AL966MEKBjQrL_AN8pzFqnRtluw"
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
