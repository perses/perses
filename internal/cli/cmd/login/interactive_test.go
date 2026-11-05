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

package login

import (
	"testing"

	"charm.land/huh/v2"
	"github.com/perses/perses/internal/cli/read"
	"github.com/stretchr/testify/require"
)

func withInteractive(t *testing.T, value bool) {
	t.Helper()
	previous := read.IsStdinTerminal
	read.IsStdinTerminal = func() bool { return value }
	t.Cleanup(func() { read.IsStdinTerminal = previous })
}

func TestEnsureInteractive(t *testing.T) {
	withInteractive(t, true)
	require.NoError(t, ensureInteractive("username", "--username"))

	withInteractive(t, false)
	err := ensureInteractive("username", "--username")
	require.Error(t, err)
	require.Contains(t, err.Error(), "username not provided and no interactive terminal is available")
	require.Contains(t, err.Error(), "--username")
}

func TestNonInteractive_NativeLogin(t *testing.T) {
	withInteractive(t, false)
	// Both inputs set: no prompt required, so no error.
	l := &nativeLogin{username: "foo", password: "bar"}
	require.NoError(t, l.SetMissingInput())

	// Missing password: must fail with an explicit error instead of trying to open a TTY.
	l = &nativeLogin{username: "foo"}
	err := l.SetMissingInput()
	require.Error(t, err)
	require.Contains(t, err.Error(), "--username and --password")
}

func TestNonInteractive_RoboticLogin(t *testing.T) {
	withInteractive(t, false)
	l := &roboticLogin{clientID: "foo", clientSecret: "bar"}
	require.NoError(t, l.SetMissingInput())

	l = &roboticLogin{clientID: "foo"}
	err := l.SetMissingInput()
	require.Error(t, err)
	require.Contains(t, err.Error(), "--client-id and --client-secret")
}

func TestNonInteractive_PromptProvider(t *testing.T) {
	withInteractive(t, false)
	o := &option{}
	_, err := o.promptProvider([]huh.Option[string]{
		huh.NewOption("Native (username/password)", nativeAuthnProvider),
		huh.NewOption("OAuth 2.0 (Github)", "github"),
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "authentication provider not provided and no interactive terminal is available")
}
