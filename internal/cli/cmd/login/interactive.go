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
	"fmt"

	"github.com/perses/perses/internal/cli/read"
)

// ensureInteractive returns an explicit error when an interactive prompt would be required
// (for the given missing input) but no terminal is available (e.g. in a CI pipeline).
// Without this check, the prompt library fails with an obscure "could not open a new TTY" error.
func ensureInteractive(missing string, flags string) error {
	if read.IsStdinTerminal() {
		return nil
	}
	return fmt.Errorf("%s not provided and no interactive terminal is available to prompt for it. "+
		"When running in a non-interactive environment (such as CI), please provide it using %s", missing, flags)
}
