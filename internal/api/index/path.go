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
	"errors"
	"fmt"
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
	// dig is the key to find at any depth, for a digStep.
	dig []keyStep
}

const digModifier = "@dig:"

// compileKey splits an index key into steps.
// It returns an error when the key uses a gjson syntax for which the path of the values can't be determined:
// wildcards, queries, multipaths, literals, pipes and modifiers other than @dig.
func compileKey(key string) ([]keyStep, error) {
	if len(key) == 0 {
		return nil, errors.New("empty key")
	}
	var steps []keyStep
	for len(key) > 0 {
		if arg, isDig := strings.CutPrefix(key, digModifier); isDig {
			// gjson ends the argument of a modifier at the first pipe, even when it is escaped.
			if strings.Contains(arg, "|") {
				return nil, errors.New("pipes are not supported")
			}
			dig, err := compileKey(arg)
			if err != nil {
				return nil, fmt.Errorf("invalid argument of %s: %w", digModifier, err)
			}
			return append(steps, keyStep{kind: digStep, dig: dig}), nil
		}
		step, rest, err := nextStep(key)
		if err != nil {
			return nil, err
		}
		steps = append(steps, step)
		key = rest
	}
	return steps, nil
}

// nextStep returns the step of the first component of the key, and the rest of the key.
func nextStep(key string) (keyStep, string, error) {
	switch key[0] {
	case '@', '{', '[', '!':
		return keyStep{}, "", fmt.Errorf("unsupported syntax %q", key)
	}
	var name strings.Builder
	i := 0
	for ; i < len(key) && key[i] != '.'; i++ {
		switch key[i] {
		case '\\':
			if i+1 == len(key) {
				return keyStep{}, "", errors.New("the key ends with an escape character")
			}
			i++
			name.WriteByte(key[i])
			continue
		case '|':
			return keyStep{}, "", errors.New("pipes are not supported")
		case '*', '?':
			// gjson selects the first key matching a wildcard for which the rest of the path exists,
			// which can't be determined step by step.
			return keyStep{}, "", errors.New("wildcards are not supported")
		}
		name.WriteByte(key[i])
	}
	raw := key[:i]
	if len(raw) == 0 {
		return keyStep{}, "", errors.New("empty component")
	}
	rest := ""
	if i < len(key) {
		rest = key[i+1:]
		if len(rest) == 0 {
			return keyStep{}, "", errors.New("the key ends with a dot")
		}
	}
	if raw[0] == '#' {
		// `#` alone at the end of a key returns the length of the array, and `#(...)` is a query.
		if raw != "#" || len(rest) == 0 {
			return keyStep{}, "", fmt.Errorf("unsupported syntax %q", raw)
		}
		return keyStep{kind: arrayItemsStep}, rest, nil
	}
	return keyStep{kind: fieldStep, raw: raw, name: name.String()}, rest, nil
}

// extractFields appends to fields the scalar values selected by the steps in the given value, with their path.
// The path is used as a stack: the recursive calls share its backing array, so it must be copied before being stored.
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
		extractFields(value.Get(step.raw), steps[1:], key, append(path, step.name), fields)
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
