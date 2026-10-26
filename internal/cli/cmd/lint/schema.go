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

package lint

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	cueErrors "cuelang.org/go/cue/errors"
	cueJSON "cuelang.org/go/encoding/json"
)

const dashboardDefinition = "#Dashboard"

type dashboardSchema struct {
	ctx        *cue.Context
	definition cue.Value
}

// loadDashboardSchema loads the complete dashboard schema, as served by the endpoint /api/v1/schemas/dashboards.
func loadDashboardSchema(path string) (*dashboardSchema, error) {
	data, err := os.ReadFile(path) //nolint: gosec
	if err != nil {
		return nil, err
	}
	ctx := cuecontext.New()
	root := ctx.CompileBytes(data, cue.Filename(path))
	if root.Err() != nil {
		return nil, fmt.Errorf("unable to load the schema %q: %w", path, root.Err())
	}
	definition := root.LookupPath(cue.ParsePath(dashboardDefinition))
	if !definition.Exists() {
		return nil, fmt.Errorf("the schema %q doesn't define %s", path, dashboardDefinition)
	}
	return &dashboardSchema{ctx: ctx, definition: definition}, nil
}

// validate validates the raw dashboard against the definition #Dashboard.
// It is the equivalent of "cue vet -d '#Dashboard' schema.cue dashboard.json".
// The raw object is used instead of the Go struct, because the latter silently drops the unknown fields.
func (s *dashboardSchema) validate(object map[string]any) error {
	object = normalize(object).(map[string]any)
	if err := s.validateObject(s.definition, object); err != nil {
		return formatErrors(err)
	}
	return nil
}

// formatErrors lists every CUE error on its own line, like "cue vet" does, but without the positions:
// they refer to the object re-encoded in JSON, not to the file of the user.
func formatErrors(err error) error {
	var messages []string
	for _, e := range cueErrors.Errors(err) {
		path := e.Path()
		// The path starts with the name of the definition validated (e.g. #Dashboard), which is not part of the object.
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

func (s *dashboardSchema) validateObject(definition cue.Value, object any) error {
	// Encoding the object as JSON first keeps the integers as integers, which matters for the CUE constraints.
	data, err := json.Marshal(object)
	if err != nil {
		return err
	}
	expr, err := cueJSON.Extract("dashboard", data)
	if err != nil {
		return err
	}
	value := s.ctx.BuildExpr(expr)
	if value.Err() != nil {
		return value.Err()
	}
	return definition.Unify(value).Validate(cue.Concrete(true))
}

// normalize converts the YAML mappings decoded as map[any]any (e.g. when a key is an unquoted number)
// into string-keyed maps, so the object can be encoded as JSON and browsed by lookup.
func normalize(value any) any {
	switch v := value.(type) {
	case map[string]any:
		result := make(map[string]any, len(v))
		for key, item := range v {
			result[key] = normalize(item)
		}
		return result
	case map[any]any:
		result := make(map[string]any, len(v))
		for key, item := range v {
			result[fmt.Sprint(key)] = normalize(item)
		}
		return result
	case []any:
		result := make([]any, len(v))
		for i, item := range v {
			result[i] = normalize(item)
		}
		return result
	default:
		return value
	}
}
