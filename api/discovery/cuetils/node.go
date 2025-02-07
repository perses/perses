// Copyright 2024 The Perses Authors
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

package cuetils

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"cuelang.org/go/cue"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
)

type NodeType string

const (
	StringNodeType  NodeType = "string"
	BoolNodeType    NodeType = "bool"
	IntegerNodeType NodeType = "integer"
	FloatNodeType   NodeType = "float"
	StructNodeType  NodeType = "struct"
)

type Node struct {
	// The type of the current node. Can be a string, number, boolean, struct
	Type NodeType `json:"type" yaml:"type"`
	// The name of field. Anonymous field is not considered
	FieldName string `json:"field_name" yaml:"field_name"`
	// In case the type is a string or a number or a boolean, value will be set here.
	ConcreteValue string `json:"concrete_value" yaml:"concrete_value"`
	// In case the type is a struct, then it will contain an array of node.
	Nodes []*Node `json:"nodes" yaml:"nodes"`
}

func (n *Node) sort() {
	if n.Nodes == nil {
		return
	}
	sort.Slice(n.Nodes, func(i, j int) bool {
		return n.Nodes[i].FieldName < n.Nodes[j].FieldName
	})
	for _, node := range n.Nodes {
		if node.Type == StructNodeType {
			node.sort()
		}
	}
}

func (n *Node) setPrimitiveValue(result map[string]interface{}) error {
	switch n.Type {
	case StringNodeType:
		result[n.FieldName] = n.ConcreteValue
	case IntegerNodeType:
		var i int64
		var err error
		if len(n.ConcreteValue) > 0 {
			i, err = strconv.ParseInt(n.ConcreteValue, 10, 64)
			if err != nil {
				return err
			}
		}
		result[n.FieldName] = i
	case FloatNodeType:
		var i float64
		var err error
		if len(n.ConcreteValue) > 0 {
			i, err = strconv.ParseFloat(n.ConcreteValue, 64)
			if err != nil {
				return err
			}
		}
		result[n.FieldName] = i
	case BoolNodeType:
		var b = false
		var err error
		if len(n.ConcreteValue) > 0 {
			b, err = strconv.ParseBool(n.ConcreteValue)
			if err != nil {
				return err
			}
		}
		result[n.FieldName] = b
	}
	return nil
}

func (n *Node) doesKindExistWithSpecIndex() (bool, int, int) {
	kindExist := false
	kindIndex := -1
	specIndex := -1
	for i, node := range n.Nodes {
		if node.FieldName == http.HTTPProxyKindField && strings.ToLower(node.ConcreteValue) == http.HTTPProxyKindName {
			kindExist = true
			kindIndex = i
		} else if node.FieldName == http.HTTPProxySpec {
			specIndex = i
		}
	}
	return kindExist, kindIndex, specIndex
}

type iteratorQueue struct {
	fieldName string
	value     cue.Value
	parent    *Node
}

func (q *iteratorQueue) setPritiveValue(node *Node) error {
	switch q.value.Kind() {
	case cue.BoolKind:
		node.Type = BoolNodeType
		b, err := q.value.Bool()
		if err != nil {
			return err
		}
		node.ConcreteValue = strconv.FormatBool(b)
		return nil
	case cue.StringKind:
		node.Type = StringNodeType
		str, err := q.value.String()
		if err != nil {
			return err
		}
		node.ConcreteValue = str
		return nil
	case cue.IntKind:
		node.Type = IntegerNodeType
		i, err := q.value.Int64()
		if err != nil {
			return err
		}
		node.ConcreteValue = strconv.FormatInt(i, 10)
		return nil
	case cue.FloatKind:
		node.Type = FloatNodeType
		f, err := q.value.Float64()
		if err != nil {
			return err
		}
		node.ConcreteValue = strconv.FormatFloat(f, 'g', -1, 64)
		return nil
	}
	return fmt.Errorf("unknown concrete type %q", q.value.Kind())
}

// buildTree is creating a tree representing the Cuelang schema.
func buildTree(queue []iteratorQueue) error {
	// It is our current element on each iteration.
	var el iteratorQueue
	for len(queue) > 0 {
		// Let's grab the first element of the queue and remove it so the size of the queue is decreasing.
		el, queue = queue[0], queue[1:]
		node := &Node{
			FieldName: el.fieldName,
		}
		el.parent.Nodes = append(el.parent.Nodes, node)
		value := el.value
		// Easy case: it's a concrete value (a string, a boolean, a number).
		// We can already create the associated Node
		if value.IsConcrete() && value.Kind() != cue.StructKind && value.Kind() != cue.ListKind {
			if setErr := el.setPritiveValue(node); setErr != nil {
				return setErr
			}
			continue
		}
		// Another case: it's a struct, so we can just fill the queue with the different attribute of the struct
		// to treat them in later loop.
		if value.Kind() == cue.StructKind {
			it, _ := value.Fields()
			for it.Next() {
				node.Type = StructNodeType
				queue = append(queue, iteratorQueue{
					fieldName: it.Selector().String(),
					value:     it.Value(),
					parent:    node,
				})
			}
		}
		// Last case: the value is incomplete. That means it doesn't contain any concrete.
		// It can be:
		// - a unification (represented by the binary operator '&') https://cuelang.org/docs/reference/spec/#unification
		// - a disjunction (represented by the binary operator '|') https://cuelang.org/docs/reference/spec/#disjunction
		// - a definition of a concrete value. Like a regexp that gives constraint on the potential concrete value.
		// For the last case, we just need to set the type of the associated node and leave the value empty.
		// When it is a unification or a disjunction, the associated IncompleteKind will be a struct.
		// Then we need to go deeper to know what binary operator is used.
		if value.Kind() == cue.BottomKind {
			switch value.IncompleteKind() {
			case cue.BoolKind:
				node.Type = BoolNodeType
			case cue.StringKind:
				node.Type = StringNodeType
			case cue.FloatKind:
				node.Type = FloatNodeType
			case cue.IntKind:
				node.Type = IntegerNodeType
			case cue.StructKind:
				node.Type = StructNodeType
				disjunction := make(map[string]cue.Value)
				flattenDisjunction(value, disjunction)
				for field, fieldVal := range disjunction {
					queue = append(queue, iteratorQueue{
						fieldName: field,
						value:     fieldVal,
						parent:    node,
					})
				}
			}
		}
	}
	return nil
}

// A disjunction or unification is the composition of at least two value with a binary operator.
// Example A | B.
// Cuelang is representing this operation with a tree like that:
//
//	  '|'
//	  / \
//	'A' 'B'
//
// In golang a struct that would represent this disjunction will be something like that:
// struct { A, B }. As we can notice, the binary operator disappears, and the result is a merged between each arc of the tree.
// It's a merge, but also it flattens the initial tree. That's what we are doing here as well to be closer to a Golang struct.
// When the parent value is a unification, we also have to merge each arc.
// The difference is simply that one arc with concrete value will replace the other incomplete value.
//
// flattenDisjunction is going down into the disjunction/unification and will fill the map with the different arc value.
func flattenDisjunction(parent cue.Value, result map[string]cue.Value) {
	op, values := parent.Expr()
	// We won't treat another case than a disjunction or a unification here.
	// Other cases should have been already treated in the buildTree function.
	if op != cue.AndOp && op != cue.OrOp {
		return
	}
	for _, val := range values {
		if val.Kind() == cue.StructKind {
			merge(result, buildMapFromStructValue(val))
		}
		if val.Kind() == cue.BottomKind && val.IncompleteKind() == cue.StructKind {
			flattenDisjunction(val, result)
		}
	}
}

func buildMapFromStructValue(v cue.Value) map[string]cue.Value {
	result := make(map[string]cue.Value)
	it, _ := v.Fields()
	for it.Next() {
		result[it.Selector().String()] = it.Value()
	}
	return result
}

func merge(a map[string]cue.Value, b map[string]cue.Value) {
	for k, v := range b {
		a[k] = v
	}
}
