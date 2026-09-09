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

package user

import (
	"testing"

	"github.com/perses/perses/internal/api/crypto"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolvePassword(t *testing.T) {
	precomputedHash, err := crypto.HashAndSalt([]byte("secretpassword"))
	require.NoError(t, err)

	tests := []struct {
		name      string
		np        v1.NativeProvider
		username  string
		wantErr   bool
		errSubstr string
		wantHash  string
	}{
		{
			name:     "plaintext password is hashed",
			np:       v1.NativeProvider{Password: "mypassword"},
			username: "alice",
		},
		{
			name:     "pre-hashed bcrypt stored as-is",
			np:       v1.NativeProvider{PasswordHash: string(precomputedHash)},
			username: "bob",
			wantHash: string(precomputedHash),
		},
		{
			name:      "invalid bcrypt hash rejected",
			np:        v1.NativeProvider{PasswordHash: "not-a-bcrypt-hash"}, //nolint:gosec // G101: test value, not a real credential
			username:  "charlie",
			wantErr:   true,
			errSubstr: "not a valid bcrypt hash",
		},
		{
			name:      "both empty returns error",
			np:        v1.NativeProvider{},
			username:  "dave",
			wantErr:   true,
			errSubstr: "password or passwordHash must be provided",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := resolvePassword(tt.np, tt.username)
			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errSubstr)
				return
			}
			require.NoError(t, err)
			assert.True(t, crypto.IsValidBcryptHash(result))
			if tt.wantHash != "" {
				assert.Equal(t, tt.wantHash, result)
			}
		})
	}
}
