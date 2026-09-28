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

package http

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTimeout(t *testing.T) {
	builder, err := New("https://datasource.example.com", Timeout("1m30s"))
	require.NoError(t, err)
	assert.Equal(t, "1m30s", string(builder.Spec.Timeout))
}

func TestTimeoutRejectsZero(t *testing.T) {
	_, err := New("https://datasource.example.com", Timeout("0"))
	require.EqualError(t, err, "HTTP proxy timeout must be greater than zero")
}

func TestTimeoutRejectsInvalidDuration(t *testing.T) {
	_, err := New("https://datasource.example.com", Timeout("30 seconds"))
	require.EqualError(t, err, `unknown unit " seconds" in duration "30 seconds"`)
}
