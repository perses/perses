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

package cue

import (
	"errors"
	"fmt"
	"strings"

	cueErrors "cuelang.org/go/cue/errors"
)

// FormatErrors lists every CUE error on its own line, as "path: message", like "cue vet" does but without the positions.
// The positions are left out because they point to the schema files as well, which are not relevant for the end user.
// The path doesn't include the definition used for the validation (e.g. #Dashboard), as it is not part of the validated data.
func FormatErrors(err error) error {
	var cueErr cueErrors.Error
	if !errors.As(err, &cueErr) {
		return err
	}
	var messages []string
	for _, e := range cueErrors.Errors(err) {
		path := e.Path()
		if len(path) > 0 && strings.HasPrefix(path[0], "#") {
			path = path[1:]
		}
		format, args := e.Msg()
		msg := fmt.Sprintf(format, args...)
		if len(path) > 0 {
			msg = strings.Join(path, ".") + ": " + msg
		}
		messages = append(messages, msg)
	}
	if len(messages) == 0 {
		return err
	}
	return fmt.Errorf("%s", strings.Join(messages, "\n"))
}
