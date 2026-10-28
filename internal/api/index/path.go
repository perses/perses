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

package index

import (
	"strconv"
	"strings"

	"github.com/tidwall/gjson"
)

// gjson doesn't give the path of the values it returns when the key contains a modifier like @dig,
// as the modifier builds a new JSON document with the values found.
// To know where each indexed value comes from, the index keys are split into steps,
// and the document is walked step by step while keeping track of the path.

type keyStepKind int

const (
	// fieldStep selects the value of an object key, or of an array item when the component is a number.
	fieldStep keyStepKind = iota
	// arrayItemsStep (#) selects every item of an array.
	arrayItemsStep
	// digStep (@dig:<key>) selects the values matching the key at any depth.
	digStep
)

type keyStep struct {
	kind keyStepKind
	// raw is the component as written in the key, used to get the value with gjson.
	raw string
	// name is the unescaped component, used in the path of the values.
	name string
	// wildcard is true when the component contains a wildcard (* or ?).
	// Like gjson, only the first matching key is selected.
	wildcard bool
	// dig is the key to find at any depth, for a digStep.
	dig []keyStep
}

const digModifier = "@dig:"

// compileKey splits an index key into steps.
// It returns false when the key uses a gjson syntax for which the path of the values can't be determined:
// queries, multipaths, literals, pipes and modifiers other than @dig.
func compileKey(key string) ([]keyStep, bool) {
	var steps []keyStep
	for len(key) > 0 {
		if strings.HasPrefix(key, digModifier) {
			// The argument of the modifier is the rest of the key.
			dig, ok := compileKey(key[len(digModifier):])
			if !ok || len(dig) == 0 {
				return nil, false
			}
			return append(steps, keyStep{kind: digStep, dig: dig}), true
		}
		step, rest, ok := nextStep(key)
		if !ok {
			return nil, false
		}
		steps = append(steps, step)
		key = rest
	}
	return steps, len(steps) > 0
}

// nextStep returns the step of the first component of the key, and the rest of the key.
func nextStep(key string) (keyStep, string, bool) {
	switch key[0] {
	case '@', '{', '[', '!':
		return keyStep{}, "", false
	}
	var name strings.Builder
	wildcard := false
	i := 0
	for ; i < len(key) && key[i] != '.'; i++ {
		switch key[i] {
		case '\\':
			i++
			if i < len(key) {
				name.WriteByte(key[i])
			}
			continue
		case '|':
			return keyStep{}, "", false
		case '*', '?':
			wildcard = true
		}
		name.WriteByte(key[i])
	}
	raw := key[:i]
	rest := ""
	if i < len(key) {
		rest = key[i+1:]
		if len(rest) == 0 {
			return keyStep{}, "", false
		}
	}
	if len(raw) == 0 {
		return keyStep{}, "", false
	}
	if raw[0] == '#' {
		// `#` alone at the end of a key returns the length of the array, and `#(...)` is a query.
		if raw != "#" || len(rest) == 0 {
			return keyStep{}, "", false
		}
		return keyStep{kind: arrayItemsStep}, rest, true
	}
	return keyStep{kind: fieldStep, raw: raw, name: name.String(), wildcard: wildcard}, rest, true
}

// extractFields appends to fields the scalar values selected by the steps in the given value, with their path.
func extractFields(value gjson.Result, steps []keyStep, key string, path []string, fields *[]indexedField) {
	if !value.Exists() {
		return
	}
	if len(steps) == 0 {
		flattenFields(value, key, path, fields)
		return
	}
	step := steps[0]
	switch step.kind {
	case fieldStep:
		child := value.Get(step.raw)
		if !child.Exists() {
			return
		}
		name := step.name
		if step.wildcard {
			var ok bool
			if name, ok = childName(value, child.Index); !ok {
				return
			}
		}
		extractFields(child, steps[1:], key, append(path, name), fields)
	case arrayItemsStep:
		if value.IsArray() {
			forEachChild(value, func(name string, child gjson.Result) {
				extractFields(child, steps[1:], key, append(path, name), fields)
			})
		}
	case digStep:
		// Same as the gjson @dig modifier: the key is searched in the value, then in each of its children, recursively.
		extractFields(value, step.dig, key, path, fields)
		forEachChild(value, func(name string, child gjson.Result) {
			extractFields(child, steps, key, append(path, name), fields)
		})
	}
}

// flattenFields appends to fields every scalar value contained in the given value, with their path.
func flattenFields(value gjson.Result, key string, path []string, fields *[]indexedField) {
	if value.IsArray() || value.IsObject() {
		forEachChild(value, func(name string, child gjson.Result) {
			flattenFields(child, key, append(path, name), fields)
		})
		return
	}
	// The strings are copied, otherwise they would keep the whole document in memory.
	clonedPath := make([]string, len(path))
	for i, p := range path {
		clonedPath[i] = strings.Clone(p)
	}
	*fields = append(*fields, indexedField{key: key, path: clonedPath, value: strings.Clone(value.String())})
}

// forEachChild calls fn with the name (the key or the index) of each child of an object or an array.
func forEachChild(value gjson.Result, fn func(name string, child gjson.Result)) {
	isArray := value.IsArray()
	if !isArray && !value.IsObject() {
		return
	}
	i := 0
	value.ForEach(func(key, child gjson.Result) bool {
		name := key.String()
		if isArray {
			name = strconv.Itoa(i)
			i++
		}
		fn(name, child)
		return true
	})
}

// childName returns the name of the child of the object located at the given position in the document.
func childName(object gjson.Result, index int) (string, bool) {
	name := ""
	found := false
	forEachChild(object, func(childKey string, child gjson.Result) {
		if !found && child.Index == index {
			name = childKey
			found = true
		}
	})
	return name, found
}
