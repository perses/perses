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

	"cuelang.org/go/cue"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
)

// NewFromSchema is generating a tree representing the schema passed in parameter.
// Note: any optional field won't be represented in this tree.
func NewFromSchema(v cue.Value) ([]*Node, error) {
	// We are expecting a proper plugin struct with "kind" and "spec" field.
	// So if the schema doesn't start with a struct, we shouldn't treat it.
	if v.Kind() != cue.StructKind {
		return nil, fmt.Errorf("schema is not a struct")
	}
	// We are ignoring the error here has it returns an error only if the value is not a struct.
	// As this is something we already checked, no need to do it again.
	it, _ := v.Fields()
	var queue []iteratorQueue
	// The root node is just created to ease the initialization of the queue.
	// It doesn't have another purpose.
	root := &Node{
		Type:      "root",
		FieldName: "root",
	}
	for it.Next() {
		queue = append(queue, iteratorQueue{
			fieldName: it.Selector().String(),
			value:     it.Value(),
			parent:    root,
		})
	}

	err := buildTree(queue)
	if err != nil {
		return nil, err
	}
	return root.Nodes, nil
}

func BuildPluginAndInjectProxy(decodedSchema []*Node, proxy http.Config) (common.Plugin, error) {
	plugin := common.Plugin{}
	if len(decodedSchema) != 2 {
		return plugin, fmt.Errorf("invalid plugin schema. Plugin schema should only contain 'kind' and 'spec' field at the root")
	}
	var kind *Node
	var spec *Node
	if decodedSchema[0].FieldName == "kind" {
		kind = decodedSchema[0]
		spec = decodedSchema[1]
	} else {
		kind = decodedSchema[1]
		spec = decodedSchema[0]
	}
	plugin.Kind = kind.ConcreteValue
	specAsAMap, err := buildPluginSpecWithProxy(spec, proxy)
	if err != nil {
		return plugin, err
	}
	plugin.Spec = specAsAMap["spec"]
	return plugin, err
}

func buildPluginSpecWithProxy(spec *Node, proxy http.Config) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	type queueElement struct {
		node *Node
		val  map[string]interface{}
	}
	queue := []queueElement{{node: spec, val: result}}
	// It is our current element on each iteration.
	var el queueElement
	for len(queue) > 0 {
		// Let's grab the first element of the queue and remove it so the size of the queue is decreasing.
		el, queue = queue[0], queue[1:]
		// Since the idea is to inject the proxy where it is required by the plugin,
		// we need first to check if we are in the correct node.
		kindExist, kindIndex, specIndex := el.node.doesKindExistWithSpecIndex()
		if kindExist {
			// Here we have found the field 'kind' with the value 'httpProxy' in the children of the current node.
			// We are likely in the following situation:
			// proxy: <-- current node
			//   kind: "HTTPProxy"
			//   spec: [..]
			//
			// So that means we need to create the struct attached to the field 'proxy' and inject the actual proxy in it.
			// First thing, let's create the maps representing the struct associated to 'proxy'
			newResult := make(map[string]interface{})
			// We grab the node corresponding to the 'kind' field
			kindNode := el.node.Nodes[kindIndex]
			// We set the map to the field 'proxy'
			el.val[el.node.FieldName] = newResult
			// Now we fill the map with the value, a.k.a 'kind' and 'spec'
			newResult[kindNode.FieldName] = kindNode.ConcreteValue
			newResult["spec"] = proxy
			// As the definition of the plugin is totally open, it's possible that there is another field defined,
			// so we need to ensure we didn't lose it.
			for i, node := range el.node.Nodes {
				if i == kindIndex || i == specIndex {
					// the field index and spec have been managed so no need to do it again
					continue
				}
				// In case there is another field to treat, let adds them in the queue.
				queue = append(queue, queueElement{node: node, val: newResult})
			}
			continue
		}

		// In case kind doesn't exist, then we just need to complete the current map or to fill the queue with additional nodes
		if el.node.Type == StructNodeType {
			newResult := make(map[string]interface{})
			el.val[el.node.FieldName] = newResult
			for _, node := range el.node.Nodes {
				queue = append(queue, queueElement{node: node, val: newResult})
			}
		} else {
			if setErr := el.node.setPrimitiveValue(el.val); setErr != nil {
				return nil, setErr
			}
		}
	}
	return result, nil
}
