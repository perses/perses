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

// anyKey and anyIndex match any user-defined map key and any list index in a plugin location.
const (
	anyKey   = "<key>"
	anyIndex = "<index>"
)

const (
	specField   = "spec"
	pluginField = "plugin"
	kindField   = "kind"
	panelsField = "panels"
)

// pluginLocation is the path of a plugin in a dashboard,
// with the type used in the name of its definition (#Plugin_<type>_<kind>).
type pluginLocation struct {
	path       []string
	pluginType string
}

// pluginLocations lists where the plugins are in a dashboard. Matching the whole path, instead of looking for a
// collection name anywhere in it, avoids mistaking a user-defined key (e.g. a panel named "queries") for a collection.
var pluginLocations = []pluginLocation{
	{path: []string{specField, panelsField, anyKey, specField, pluginField}, pluginType: "Panel"},
	{path: []string{specField, panelsField, anyKey, specField, "queries", anyIndex, specField, pluginField}, pluginType: "Query"},
	{path: []string{specField, panelsField, anyKey, specField, "annotations", anyIndex, pluginField}, pluginType: "Annotation"},
	{path: []string{specField, "datasources", anyKey, pluginField}, pluginType: "Datasource"},
	{path: []string{specField, "variables", anyIndex, specField, pluginField}, pluginType: "Variable"},
	{path: []string{specField, "annotations", anyIndex, pluginField}, pluginType: "Annotation"},
}

// textVariableFields and listVariableFields are the fields of the spec of the two kinds of variables.
// The schema of a variable is a disjunction between both kinds, which is not discriminated by the kind of the variable.
// So when a variable is invalid, CUE also reports the errors of the other kind, which are ignored.
var (
	textVariableFields = []string{"value", "constant"}
	listVariableFields = []string{pluginField, "defaultValue", "allowAllValue", "allowMultiple", "customAllValue", "capturingRegexp", "sort"}
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
	object = normalize(object).(map[string]any)
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
		if len(path) >= 2 && path[len(path)-1] == kindField && path[len(path)-2] == pluginField {
			pluginPath := path[:len(path)-1]
			key := strings.Join(pluginPath, ".")
			handled, checked := checkedPlugins[key]
			if !checked {
				var pluginMessages []string
				pluginMessages, handled = s.validatePlugin(pluginPath, object)
				checkedPlugins[key] = handled
				messages = append(messages, pluginMessages...)
			}
			if handled {
				continue
			}
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
// It returns false when the plugin can't be validated on its own, in which case the original CUE errors must be kept.
func (s *dashboardSchema) validatePlugin(pluginPath []string, object map[string]any) ([]string, bool) {
	pathStr := strings.Join(pluginPath, ".")
	raw, ok := lookup(object, pluginPath)
	if !ok {
		return []string{withPath(pathStr, "invalid plugin")}, true
	}
	plugin, ok := raw.(map[string]any)
	if !ok {
		return []string{withPath(pathStr, "invalid plugin")}, true
	}
	kind, ok := plugin[kindField].(string)
	if !ok {
		return nil, false
	}
	location, ok := findPluginLocation(pluginPath)
	if !ok {
		return nil, false
	}
	kinds, ok := s.pluginKinds(location)
	if !ok {
		return nil, false
	}
	if !slices.Contains(kinds, kind) {
		return []string{withPath(pathStr+".kind", fmt.Sprintf("unknown %s plugin %q", strings.ToLower(location.pluginType), kind))}, true
	}
	definition, ok := s.pluginDefinition(location.pluginType, kind)
	if !ok {
		// The plugin is known, but its schema is embedded in the dashboard schema instead of being declared in a
		// definition (see internal/api/plugin/schema/merge.go). The "conflicting values" errors on its kind come from
		// the other plugins and are dropped, the other errors are kept.
		return nil, true
	}
	err := s.validateObject(definition, plugin)
	if err == nil {
		return nil, false
	}
	var messages []string
	for _, m := range s.summarize(err, plugin) {
		messages = append(messages, pathStr+"."+m)
	}
	return messages, true
}

// findPluginLocation returns the location matching the path of a plugin.
func findPluginLocation(pluginPath []string) (pluginLocation, bool) {
	for _, location := range pluginLocations {
		if len(location.path) != len(pluginPath) {
			continue
		}
		matches := true
		for i, element := range location.path {
			if element != anyKey && element != anyIndex && element != pluginPath[i] {
				matches = false
				break
			}
		}
		if matches {
			return location, true
		}
	}
	return pluginLocation{}, false
}

// pluginKinds returns the kinds of the plugins allowed by the dashboard schema at the given location.
// It returns false when the schema doesn't list the plugins with a fixed kind, e.g. when no plugin of this type is loaded.
func (s *dashboardSchema) pluginKinds(location pluginLocation) ([]string, bool) {
	selectors := make([]cue.Selector, 0, len(location.path))
	for _, element := range location.path {
		switch element {
		case anyKey:
			selectors = append(selectors, cue.AnyString)
		case anyIndex:
			selectors = append(selectors, cue.AnyIndex)
		default:
			selectors = append(selectors, cue.Str(element))
		}
	}
	plugins := lookupSchema(s.definition, selectors)
	if len(plugins) == 0 {
		return nil, false
	}
	var kinds []string
	for _, plugin := range plugins {
		kind, err := plugin.LookupPath(cue.MakePath(cue.Str(kindField))).String()
		if err != nil {
			return nil, false
		}
		kinds = append(kinds, kind)
	}
	return kinds, true
}

// lookupSchema returns the values found in the schema at the given path.
// Every branch of a disjunction (e.g. `*null | {...}` or the plugins of a type) is looked up separately.
func lookupSchema(value cue.Value, selectors []cue.Selector) []cue.Value {
	if op, branches := value.Expr(); op == cue.OrOp {
		var result []cue.Value
		for _, branch := range branches {
			result = append(result, lookupSchema(branch, selectors)...)
		}
		return result
	}
	if len(selectors) == 0 {
		return []cue.Value{value}
	}
	next := value.LookupPath(cue.MakePath(selectors[0]))
	if !next.Exists() && selectors[0].Type() == cue.StringLabel {
		next = value.LookupPath(cue.MakePath(selectors[0].Optional()))
	}
	if !next.Exists() {
		return nil
	}
	return lookupSchema(next, selectors[1:])
}

// pluginDefinition returns the definition of the plugin of the given type and kind.
// The definition is found by its kind rather than by its name, because the name is sanitized and can have a suffix
// (see internal/api/plugin/schema/merge.go).
func (s *dashboardSchema) pluginDefinition(pluginType, kind string) (cue.Value, bool) {
	iter, err := s.root.Fields(cue.Definitions(true))
	if err != nil {
		return cue.Value{}, false
	}
	prefix := fmt.Sprintf("#Plugin_%s_", pluginType)
	var definitions []cue.Value
	for iter.Next() {
		if !iter.Selector().IsDefinition() || !strings.HasPrefix(iter.Selector().String(), prefix) {
			continue
		}
		if k, err := iter.Value().LookupPath(cue.MakePath(cue.Str(kindField))).String(); err == nil && k == kind {
			definitions = append(definitions, iter.Value())
		}
	}
	if len(definitions) != 1 {
		return cue.Value{}, false
	}
	return definitions[0], true
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
	if len(path) < 5 || path[0] != specField || path[1] != "variables" || path[3] != specField {
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
	switch variableObject[kindField] {
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
