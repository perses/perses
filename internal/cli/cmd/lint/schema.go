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
	"regexp"
	"slices"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	cueErrors "cuelang.org/go/cue/errors"
	cueJSON "cuelang.org/go/encoding/json"
)

const dashboardDefinition = "#Dashboard"

// conflictRegexp matches the message of a CUE error like: conflicting values "a" and "b"
var conflictRegexp = regexp.MustCompile(`^conflicting values (.+) and (.+)$`)

// pluginTypes maps the field containing a plugin to the type used in the name of its definition (#Plugin_<type>_<kind>).
var pluginTypes = map[string]string{
	"annotations": "Annotation",
	"datasources": "Datasource",
	"panels":      "Panel",
	"queries":     "Query",
	"variables":   "Variable",
}

// textVariableFields and listVariableFields are the fields of the spec of the two kinds of variables.
// The schema of a variable is a disjunction between both kinds, which is not discriminated by the kind of the variable.
// So when a variable is invalid, CUE also reports the errors of the other kind, which are ignored.
var (
	textVariableFields = []string{"value", "constant"}
	listVariableFields = []string{"plugin", "defaultValue", "allowAllValue", "allowMultiple", "customAllValue", "capturingRegexp", "sort"}
)

type dashboardSchema struct {
	ctx        *cue.Context
	root       cue.Value
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
	return &dashboardSchema{ctx: ctx, root: root, definition: definition}, nil
}

// validate validates the raw dashboard against the definition #Dashboard.
// It is the equivalent of "cue vet -d '#Dashboard' schema.cue dashboard.json".
// The raw object is used instead of the Go struct, because the latter silently drops the unknown fields.
func (s *dashboardSchema) validate(object map[string]any) error {
	if err := s.validateObject(s.definition, object); err != nil {
		return fmt.Errorf("%s", strings.Join(s.summarize(err, object), "; "))
	}
	return nil
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

// summarize turns the CUE error into a short list of readable messages.
//
// When a plugin doesn't match its schema, CUE reports that the plugin matches none of the plugins of the disjunction,
// with a "conflicting values" error for the kind of every other plugin, which hides the actual error.
// In this case, the plugin is validated again against the definition of its own kind to get the actual error.
// Then, when a value matches none of the values allowed by a field (e.g. an enum),
// the "conflicting values" errors are merged into a single "invalid value" error.
func (s *dashboardSchema) summarize(err error, object map[string]any) []string {
	type conflict struct {
		path  string
		left  []string
		right []string
	}
	var messages []string
	var conflicts []*conflict
	checkedPlugins := map[string]bool{}
	for _, e := range cueErrors.Errors(err) {
		path := e.Path()
		// The path starts with the name of the definition validated (e.g. #Dashboard), which is not part of the object.
		if len(path) > 0 && strings.HasPrefix(path[0], "#") {
			path = path[1:]
		}
		format, args := e.Msg()
		msg := fmt.Sprintf(format, args...)
		if strings.Contains(format, "errors in empty disjunction") {
			continue
		}
		if isOtherVariableKindError(path, msg, object) {
			continue
		}
		pathStr := strings.Join(path, ".")
		if len(path) >= 2 && path[len(path)-1] == "kind" && path[len(path)-2] == "plugin" {
			pluginPath := path[:len(path)-1]
			key := strings.Join(pluginPath, ".")
			if !checkedPlugins[key] {
				checkedPlugins[key] = true
				messages = append(messages, s.validatePlugin(pluginPath, object)...)
			}
			continue
		}
		if matches := conflictRegexp.FindStringSubmatch(msg); matches != nil {
			if isContainer(matches[1]) || isContainer(matches[2]) {
				// A whole struct or list conflicting with the schema, the actual error is reported on its fields.
				continue
			}
			index := slices.IndexFunc(conflicts, func(c *conflict) bool { return c.path == pathStr })
			if index < 0 {
				conflicts = append(conflicts, &conflict{path: pathStr})
				index = len(conflicts) - 1
			}
			conflicts[index].left = append(conflicts[index].left, matches[1])
			conflicts[index].right = append(conflicts[index].right, matches[2])
			continue
		}
		if strings.HasPrefix(msg, "incomplete value ") && isContainer(strings.TrimPrefix(msg, "incomplete value ")) {
			// CUE prints the whole value, which is not readable.
			msg = "incomplete value, a required field is missing"
		}
		messages = append(messages, withPath(pathStr, msg))
	}
	for _, c := range conflicts {
		switch {
		case len(c.left) == 1:
			messages = append(messages, withPath(c.path, fmt.Sprintf("conflicting values %s and %s", c.left[0], c.right[0])))
		case allEqual(c.right):
			messages = append(messages, withPath(c.path, "invalid value "+c.right[0]))
		case allEqual(c.left):
			messages = append(messages, withPath(c.path, "invalid value "+c.left[0]))
		default:
			messages = append(messages, withPath(c.path, "invalid value"))
		}
	}
	var unique []string
	for _, m := range messages {
		if !slices.Contains(unique, m) {
			unique = append(unique, m)
		}
	}
	if len(unique) == 0 {
		// Should not happen, but better to return the raw error than nothing.
		return []string{err.Error()}
	}
	return unique
}

// validatePlugin validates the plugin found at the given path against the definition of its kind.
func (s *dashboardSchema) validatePlugin(pluginPath []string, object map[string]any) []string {
	pathStr := strings.Join(pluginPath, ".")
	raw, ok := lookup(object, pluginPath)
	if !ok {
		return []string{withPath(pathStr, "invalid plugin")}
	}
	plugin, ok := raw.(map[string]any)
	if !ok {
		return []string{withPath(pathStr, "invalid plugin")}
	}
	kind := fmt.Sprintf("%v", plugin["kind"])
	pluginType := ""
	for i := len(pluginPath) - 1; i >= 0 && len(pluginType) == 0; i-- {
		pluginType = pluginTypes[pluginPath[i]]
	}
	definition := s.root.LookupPath(cue.MakePath(cue.Def(fmt.Sprintf("#Plugin_%s_%s", pluginType, kind))))
	if len(pluginType) == 0 || !definition.Exists() {
		return []string{withPath(pathStr+".kind", fmt.Sprintf("unknown %s plugin %q", strings.ToLower(pluginType), kind))}
	}
	err := s.validateObject(definition, plugin)
	if err == nil {
		return []string{withPath(pathStr, "invalid plugin")}
	}
	var messages []string
	for _, m := range s.summarize(err, plugin) {
		messages = append(messages, pathStr+"."+m)
	}
	return messages
}

// lookup returns the value found in the raw object at the given CUE path.
func lookup(object any, path []string) (any, bool) {
	current := object
	for _, selector := range path {
		if unquoted, err := strconv.Unquote(selector); err == nil {
			selector = unquoted
		}
		switch value := current.(type) {
		case map[string]any:
			next, ok := value[selector]
			if !ok {
				return nil, false
			}
			current = next
		case []any:
			index, err := strconv.Atoi(selector)
			if err != nil || index < 0 || index >= len(value) {
				return nil, false
			}
			current = value[index]
		default:
			return nil, false
		}
	}
	return current, true
}

// isOtherVariableKindError tells whether the error comes from the schema of the other kind of variable.
// path is expected to look like: spec.variables.<index>.spec.<field>...
func isOtherVariableKindError(path []string, msg string, object map[string]any) bool {
	if len(path) < 5 || path[0] != "spec" || path[1] != "variables" || path[3] != "spec" {
		return false
	}
	variable, ok := lookup(object, path[:3])
	if !ok {
		return false
	}
	variableObject, ok := variable.(map[string]any)
	if !ok {
		return false
	}
	var ownFields, otherFields []string
	switch variableObject["kind"] {
	case "ListVariable":
		ownFields, otherFields = listVariableFields, textVariableFields
	case "TextVariable":
		ownFields, otherFields = textVariableFields, listVariableFields
	default:
		return false
	}
	field := path[4]
	if len(path) == 5 && strings.Contains(msg, "field not allowed") {
		// The other kind doesn't allow the fields specific to this kind.
		return slices.Contains(ownFields, field)
	}
	// The other kind validates (or requires) its own fields.
	return slices.Contains(otherFields, field)
}

func isContainer(value string) bool {
	return strings.HasPrefix(value, "{") || strings.HasPrefix(value, "[")
}

func withPath(path, msg string) string {
	if len(path) == 0 {
		return msg
	}
	return path + ": " + msg
}

func allEqual(values []string) bool {
	for _, v := range values {
		if v != values[0] {
			return false
		}
	}
	return true
}
