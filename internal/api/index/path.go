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
	"encoding/binary"
	"errors"
	"fmt"
	"math"
	"slices"
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
	// fieldStep selects a value with consecutive components, each selecting the value of an object key, or of an array
	// item when the component is a number.
	fieldStep keyStepKind = iota
	// arrayItemsStep (#) selects every item of an array, or the value of the "#" key of an object.
	arrayItemsStep
	// digStep (@dig:<key>) selects the values matching the key at any depth.
	digStep
)

type keyStep struct {
	kind keyStepKind
	// key is the rest of the key from this step, as written, used to get the values with gjson when their path can't be
	// determined (see fieldsBuilder.extractFields).
	key string
	// raw is the components of a fieldStep as written in the key, used to get the value with gjson.
	raw string
	// names are the unescaped components of a fieldStep, used in the path of the values.
	names []string
	// dig is the key to find at any depth, for a digStep.
	dig []keyStep
}

const digModifier = "@dig:"

// compileKey splits an index key into steps. Consecutive field components are grouped in a single step, evaluated at
// once as gjson does: it doesn't look for the next components inside a string, e.g. the key a.0 selects nothing in
// {"a": "[1]"}.
// It returns an error when the key uses a gjson syntax for which the path of the values can't be determined:
// wildcards, queries, multipaths, literals, pipes, modifiers other than @dig, JSON arguments of @dig and numbers with
// leading zeros or out of the range of int.
func compileKey(key string) ([]keyStep, error) {
	if len(key) == 0 {
		return nil, errors.New("empty key")
	}
	var steps []keyStep
	for rest := key; len(rest) > 0; {
		if arg, isDig := strings.CutPrefix(rest, digModifier); isDig {
			// gjson ends the argument of a modifier at the first pipe, even when it is escaped.
			if strings.Contains(arg, "|") {
				return nil, errors.New("pipes are not supported")
			}
			// gjson parses an argument starting with {, [ or " as JSON, and evaluates the rest of the key on the array
			// of the values found: @dig:"a".0 selects the first value found for the key "a", quotes included.
			if len(arg) > 0 && strings.IndexByte(`{["`, arg[0]) >= 0 {
				return nil, errors.New("JSON arguments of @dig are not supported")
			}
			dig, err := compileKey(arg)
			if err != nil {
				return nil, fmt.Errorf("invalid argument of %s: %w", digModifier, err)
			}
			return append(steps, keyStep{kind: digStep, key: rest, dig: dig}), nil
		}
		raw, name, next, err := nextComponent(rest)
		if err != nil {
			return nil, err
		}
		last := len(steps) - 1
		if raw == "#" {
			steps = append(steps, keyStep{kind: arrayItemsStep, key: rest})
		} else if last >= 0 && steps[last].kind == fieldStep {
			// The components are separated by a single dot.
			steps[last].raw = steps[last].key[:len(steps[last].raw)+1+len(raw)]
			steps[last].names = append(steps[last].names, name)
		} else {
			steps = append(steps, keyStep{kind: fieldStep, key: rest, raw: raw, names: []string{name}})
		}
		rest = next
	}
	return steps, nil
}

// nextComponent returns the first component of the key, as written and unescaped, and the rest of the key.
func nextComponent(key string) (raw, name, rest string, err error) {
	switch key[0] {
	case '@', '{', '[', '!':
		return "", "", "", fmt.Errorf("unsupported syntax %q", key)
	}
	var unescaped strings.Builder
	i := 0
	for ; i < len(key) && key[i] != '.'; i++ {
		switch key[i] {
		case '\\':
			if i+1 == len(key) {
				return "", "", "", errors.New("the key ends with an escape character")
			}
			i++
			unescaped.WriteByte(key[i])
			continue
		case '|':
			return "", "", "", errors.New("pipes are not supported")
		case '*', '?':
			// gjson selects the first key matching a wildcard for which the rest of the path exists,
			// which can't be determined step by step.
			return "", "", "", errors.New("wildcards are not supported")
		}
		unescaped.WriteByte(key[i])
	}
	raw = key[:i]
	if len(raw) == 0 {
		return "", "", "", errors.New("empty component")
	}
	if i < len(key) {
		rest = key[i+1:]
		if len(rest) == 0 {
			return "", "", "", errors.New("the key ends with a dot")
		}
	}
	// `#` alone at the end of a key returns the length of an array, and `#(...)` is a query.
	if raw[0] == '#' && (raw != "#" || len(rest) == 0) {
		return "", "", "", fmt.Errorf("unsupported syntax %q", raw)
	}
	// gjson reads a component made of digits as an array index, ignoring its leading zeros and, on 32-bit platforms,
	// truncating it. The path of the item it selects must contain its index: 1, not 01 or 4294967297.
	if strings.TrimLeft(raw, "0123456789") == "" {
		if n, err := strconv.Atoi(raw); err != nil || strconv.Itoa(n) != raw {
			return "", "", "", fmt.Errorf("unsupported array index %q", raw)
		}
	}
	return raw, unescaped.String(), rest, nil
}

// stepNames appends to names the names of the field steps that aren't in it yet, including the ones of the @dig steps.
func stepNames(steps []keyStep, names []string) []string {
	for _, s := range steps {
		switch s.kind {
		case fieldStep:
			for _, name := range s.names {
				if !slices.Contains(names, name) {
					names = append(names, name)
				}
			}
		case digStep:
			names = stepNames(s.dig, names)
		}
	}
	return names
}

// fieldsBuilder collects the fields of a document while it is indexed. Their values and the end of their paths are
// appended to a single buffer, so that the index stores the fields of a document in two allocations: its data and its
// fields (see index). It is reused from a document to another, so it must not be shared by concurrent indexations.
type fieldsBuilder struct {
	data   []byte
	fields []indexedField
	// key is the position, in the indexed keys, of the key whose values are extracted, and names its step names.
	key   uint32
	names []string
	// path is pre-allocated, so the appends done while walking a document don't need to allocate.
	path []string
	// tooLarge is set when a field doesn't fit in maxDataSize: it isn't appended, nor are the fields that follow.
	tooLarge bool
}

// maxDataSize is the maximum size of the data of a document, as the fields store 32-bit offsets. It is a uint64, as
// math.MaxUint32 overflows int on 32-bit platforms.
// It is a variable, so it can be lowered in tests.
var maxDataSize uint64 = math.MaxUint32

func (b *fieldsBuilder) reset() {
	b.data = b.data[:0]
	b.fields = b.fields[:0]
	if b.path == nil {
		b.path = make([]string, 0, 16)
	}
	b.tooLarge = false
}

// appendField appends a field made of the value and of the end of its path. Each component of the path is encoded as
// a uvarint: twice the position of the component in the step names of the key plus one when it is one of them, which
// is often the case and saves storing it, otherwise twice its length followed by its bytes.
func (b *fieldsBuilder) appendField(value string, path []string) {
	b.appendKeyField(value, path, b.key)
}

// appendPathlessField appends a field whose path can't be determined.
func (b *fieldsBuilder) appendPathlessField(value string) {
	b.appendKeyField(value, nil, b.key|pathlessField)
}

func (b *fieldsBuilder) appendKeyField(value string, path []string, key uint32) {
	if b.tooLarge {
		return
	}
	start := len(b.data)
	b.data = append(b.data, value...)
	valueEnd := len(b.data)
	for _, p := range path {
		if i := slices.Index(b.names, p); i >= 0 {
			b.data = binary.AppendUvarint(b.data, uint64(i)<<1|1)
		} else {
			b.data = binary.AppendUvarint(b.data, uint64(len(p))<<1)
			b.data = append(b.data, p...)
		}
	}
	end := len(b.data)
	if uint64(end) > maxDataSize {
		b.data = b.data[:start]
		b.tooLarge = true
		return
	}
	b.fields = append(b.fields, indexedField{start: uint32(start), valueEnd: uint32(valueEnd), end: uint32(end), key: key}) //nolint:gosec // G115: the offsets don't exceed maxDataSize
}

// nextPathComponent returns the first component of a path encoded by appendField, and the rest of the path.
// names are the step names of the key of the field.
func nextPathComponent(path string, names []string) (string, string) {
	// The uvarint is decoded in a uint64, like it is encoded, so it can't be truncated on 32-bit platforms.
	var x, i uint64
	for shift := 0; ; shift += 7 {
		c := path[i]
		i++
		x |= uint64(c&0x7f) << shift
		if c < 0x80 {
			break
		}
	}
	if x&1 == 1 {
		return names[x>>1], path[i:]
	}
	end := i + x>>1
	return path[i:end], path[end:]
}

// extractKeyFields appends the scalar values selected by the key in the raw document, with the end of their path:
// the path after the prefix of the key, which is the same for every document, so it is not stored.
// key is the position of the key in the indexed keys.
func (b *fieldsBuilder) extractKeyFields(raw rawDocument, key uint32, k indexedKey) {
	b.key, b.names = key, k.names
	switch {
	case k.steps == nil:
		b.recursiveDeepExtractFields(raw.getFields(k.key))
	case k.steps[0].kind == fieldStep:
		// The components of the first step are the prefix of the key. Unlike gjson.ParseBytes, gjson.GetBytes copies
		// only the value they select, not the whole document.
		b.extractFields(gjson.GetBytes(raw, k.steps[0].raw), k.steps[1:], b.path[:0], false)
	default:
		// The key starts with # or @dig, so the whole document is walked.
		b.extractFields(gjson.ParseBytes(raw), k.steps, b.path[:0], true)
	}
}

// extractFields appends the scalar values selected by the steps in the given value, with their path.
// isRoot is set when gjson evaluates the steps on the value as on a new document, which it does for the document, for
// each item of an array selected by #, and for each value @dig searches its key in. Then, when the value is a scalar,
// gjson evaluates the steps on the first array or object it finds in it, even inside a string, e.g. the key 0 selects
// 1 in "[1]": as the location of such a value can't be represented, it is appended without its path. Otherwise, gjson
// doesn't select anything in a scalar.
// The path is used as a stack: the recursive calls share its backing array, which is safe as it is copied in the
// data when a field is appended.
func (b *fieldsBuilder) extractFields(value gjson.Result, steps []keyStep, path []string, isRoot bool) {
	if b.tooLarge || !value.Exists() {
		return
	}
	if len(steps) == 0 {
		b.flattenFields(value, path)
		return
	}
	step := steps[0]
	if step.kind == digStep {
		// Same as the gjson @dig modifier: the key is searched in the value, then in each of its children, recursively,
		// each of them being a new document.
		b.extractFields(value, step.dig, path, true)
		forEachChild(value, func(name string, child gjson.Result) {
			b.extractFields(child, steps, append(path, name), true)
		})
		return
	}
	isArray := value.IsArray()
	if !isArray && !value.IsObject() {
		if isRoot {
			b.recursiveDeepExtractFields([]gjson.Result{value.Get(step.key)})
		}
		return
	}
	switch {
	case step.kind == fieldStep:
		b.extractFields(value.Get(step.raw), steps[1:], append(path, step.names...), false)
	case isArray:
		forEachChild(value, func(name string, child gjson.Result) {
			b.extractFields(child, steps[1:], append(path, name), true)
		})
	default:
		// On an object, gjson selects the value of the "#" key.
		b.extractFields(value.Get("#"), steps[1:], append(path, "#"), false)
	}
}

// flattenFields appends every scalar value contained in the given value, with their path.
func (b *fieldsBuilder) flattenFields(value gjson.Result, path []string) {
	if value.IsArray() || value.IsObject() {
		forEachChild(value, func(name string, child gjson.Result) {
			b.flattenFields(child, append(path, name))
		})
		return
	}
	b.appendField(value.String(), path)
}

// recursiveDeepExtractFields appends the scalar values of the given results, without their path.
// It is used for the values whose path can't be determined.
func (b *fieldsBuilder) recursiveDeepExtractFields(fs []gjson.Result) {
	for _, f := range fs {
		if !f.Exists() {
			continue
		}
		if f.IsArray() {
			b.recursiveDeepExtractFields(f.Array())
		} else if f.IsObject() {
			for _, v := range f.Map() {
				b.recursiveDeepExtractFields([]gjson.Result{v})
			}
		} else {
			b.appendPathlessField(f.String())
		}
	}
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
