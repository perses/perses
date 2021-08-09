// Copyright 2021 The Perses Authors
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

// Package variable is providing the necessary functions:
// * to calculate the build order of the variables
// * and to calculate the list of value for a given variable.
package variable

import (
	"fmt"
	"regexp"

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

var (
	variableRegexp  = regexp.MustCompile("^[a-zA-Z0-9_-]+$")
	variableRegexp2 = regexp.MustCompile(`\$([a-zA-Z0-9_-]+)`)
)

type Group struct {
	Variables []string
}

// BuildOrder determinate which variable we have to build first (aka to perform the query).
// Here is the description of the algorithm followed:
//
// 1. First calculate which variable depend of which other variable
// 2. Then, thanks to the dependencies, we can create a dependency graph.
// 3. Then we have to determinate the build order.

func BuildOrder(variables map[string]*v1.DashboardVariable, current map[string]string, previous map[string]string) ([]Group, error) {
	// calculate the build order of the variable just to verify there is no error
	g, err := buildGraph(variables, current, previous)
	if err != nil {
		return nil, err
	}
	// shake the graph to remove the already calculated node.
	g.shaking()
	// finally determinate the build order
	return g.buildOrder()
}

func buildGraph(variables map[string]*v1.DashboardVariable, current map[string]string, previous map[string]string) (*graph, error) {
	deps, err := buildVariableDependencies(variables)
	if err != nil {
		return nil, err
	}
	vars := make([]string, 0, len(variables))
	for v := range variables {
		vars = append(vars, v)
	}
	return newGraph(vars, deps, current, previous), nil
}

func buildVariableDependencies(variables map[string]*v1.DashboardVariable) (map[string][]string, error) {
	result := make(map[string][]string)
	for name, variable := range variables {
		if !variableRegexp.MatchString(name) {
			return nil, fmt.Errorf("'%s' is not a correct variable name. It should match the regexp: %s", name, variableRegexp.String())
		}
		var matches [][]string
		switch param := variable.Parameter.(type) {
		case *v1.PromQLQueryVariableParameter:
			matches = findAllVariableUsed(param.Expr)
		case *v1.LabelNamesQueryVariableParameter:
			for _, matcher := range param.Matchers {
				matches = append(matches, findAllVariableUsed(matcher)...)
			}
		case *v1.LabelValuesQueryVariableParameter:
			matches = findAllVariableUsed(param.LabelName)
			for _, matcher := range param.Matchers {
				matches = append(matches, findAllVariableUsed(matcher)...)
			}
		}
		deps := make(map[string]bool)
		for _, match := range matches {
			// match[0] is the string that is matching the regexp (including the $)
			// match[1] is the string that is matching the group defined by the regexp. (the string without the $)
			if _, ok := variables[match[1]]; !ok {
				return nil, fmt.Errorf("variable '%s' is used in the variable '%s' but not defined", match[1], name)
			}
			deps[match[1]] = true
		}
		for dep := range deps {
			result[name] = append(result[name], dep)
		}
	}
	return result, nil
}

func findAllVariableUsed(str string) [][]string {
	return variableRegexp2.FindAllStringSubmatch(str, -1)
}

func newGraph(variables []string, dependencies map[string][]string, current map[string]string, previous map[string]string) *graph {
	g := &graph{
		nodes:        make(map[string]*node),
		currentValue: current,
		diffMap:      diff(current, previous),
	}
	for _, variable := range variables {
		g.nodes[variable] = &node{
			name:     variable,
			children: make(map[string]*node),
		}
	}
	for variable, deps := range dependencies {
		for _, dep := range deps {
			g.addEdge(dep, variable)
		}
	}
	return g
}

type graph struct {
	diffMap      map[string]bool
	currentValue map[string]string
	nodes        map[string]*node
}

// buildOrder determinate the build order of the variables
// For example we could have:
//          (f)         (d)
//         / | \         |
//       (c) |  (b)     (g)
//        \  |  /|
//          (a)  /
//           |  /
//           | /
//           (e)
// In this example, we should build first (f) and (d), because there is no incoming edge to these nodes.
// Once it is done, it is irrelevant that some nodes are dependent on (f) and (d) since they have already been built.
// So we can remove the d and f's outgoing edges.
//      build order, (f), (d)
//          (f)         (d)
//
//       (c)    (b)     (g)
//        \     /|
//          (a)  /
//           |  /
//           | /
//           (e)
// Also we can notice (f) and (d) can be built in parallel.
// So instead of having an ordered list of the different variable/node to build, we could have instead a list of ordered variable's group.
// Where every variable contained in the group can be built in parallel.
// Like that we have now the following build order:
//      build order: group0
//      group0: (f), (d)
//
// Next we can build (c), (b) and (g) (also in parallel applying the same logic as above) And then we can remove their outgoing edges
//      build order: group0, group1
//      group0: (f), (d)
//      group1: (c), (b), (g)
//          (f)         (d)
//
//       (c)    (b)     (g)
//
//          (a)
//           |
//           |
//          (e)
// Then variable (a) can be built which is removing the outgoing edge to (e). This leaves just (e) to be built and we have the final build order:
//      build order: group0, group1, group2, group3
//      group0: (f), (d)
//      group1: (c), (b), (g)
//      group2: (a)
//      group3: (e)
func (g *graph) buildOrder() ([]Group, error) {
	remainingNodes := g.buildInitialRemainingNodes()
	var groups []Group
	for len(remainingNodes) > 0 {
		group := Group{}
		// First thing to do is to loop other the remaining node and find the one that has 0 incoming edge.
		// When we found a node that has no dep, then we remove it from the list of the remainingNode
		var newRemainingNode []*node
		for _, n := range remainingNodes {
			if n.dependencies == 0 {
				group.Variables = append(group.Variables, n.name)
			} else {
				newRemainingNode = append(newRemainingNode, n)
			}
		}
		// if no variable has been added to the current node, then it means there are no nodes with no deps which means there is a circular dependency
		if len(group.Variables) == 0 {
			return nil, fmt.Errorf("circular dependency detected")
		}
		remainingNodes = newRemainingNode
		// Then we loop other the available node in the current group to decrease for each children the number of dependencies
		for _, v := range group.Variables {
			for _, child := range g.nodes[v].children {
				child.dependencies--
			}
		}
		// Finally we add the group to the groupOrder
		groups = append(groups, group)
	}
	return groups, nil
}

func (g *graph) addEdge(startName string, endName string) {
	g.nodes[startName].addChild(g.nodes[endName])
}

func (g *graph) buildInitialRemainingNodes() []*node {
	remainingNodes := make([]*node, 0, len(g.nodes))
	for _, n := range g.nodes {
		remainingNodes = append(remainingNodes, n)
	}
	return remainingNodes
}

// shaking is going loop other the graph and remove the nodes that are already calculated.
// To know if a node needs to be calculated or not is based on:
// 1. if a value for the variable wrapped by the node exists
// 2. if this value changed between the currentSelectedValue and the previous one.
//
// If the condition 1 is false, then for sure the node needs to be calculated and so as its children
// If the condition 1 and 2 is true, then the node doesn't need to be calculated but its children should be.
// For example, we have this graph:
// (a) (b)
//   \ /
//   (c)
// Let's imagine that we have the value for each node (a,b,c). But we also know that the value (a) changed between two states.
// Since (c) depends on the value of (a) and the current value of (c) is based on a previous value of (a).
// Then we need to calculate again (c), since (a) doesn't have the same value.
// So, based on this logic, after shaking the graph, the graph should look like this:
// (c) (yes only c is remaining in the graph. Others nodes have been removed since their values are already known)
//
// To be able to know if the children can be removed as well if their values are known and if the parents value is known too
// or if they have to be recalculated because or the parents value is not know or it changed, we will introduced a boolean on each node.
// If it is true then, the node need to be recalculated even it has no incoming edged. Otherwise it can be removed too.
//
// Let see if it works with a more complex example:
//          (f)         (d)
//         / | \         |
//       (c) |  (b)     (g)
//        \  |  /|
//          (a)  /
//           |  /
//           | /
//           (e)
// Let's imagine we know the value of (f) (c) and (g). We also know that the value of (a) and (d) changed.
// So we don't know the value of (b) and (e).
//
// Let's start by the top of the graph. (f) is known same as (d). So, we don't need to calculate them and we can remove them.
// Since the value of (f) doesn't change, then we can set the boolean of its children to false.
// Which is not the same for (d), we know its value, but we also the value changed. Which means its children should all be set to true.
// We now have the following graph:
//       (c) false  (b) false     (g) true
//         \        /|
//          \      / |
//           \    /  |
//            \  /  /
//             (a) /
//              | /
//             (e)
//
// We know the value of (c), it doesn't have any incoming edge and it is marked as false. So it can be removed and its outgoing edges as well.
// We don't know the value of (b) so we can't remove it. Also we then need to set all its children to true so they have to be calculated as well.
// We now have the following graph:
//        (b) false     (g) true
//         |\
//         | \
//         |  |
//         |  |
//  true  (a) |
//         | /
//        (e)
// The shaking can be stopped as there is no more any nodes that we know the value with no incoming edges
func (g *graph) shaking() {
	remainingNodes := g.buildInitialRemainingNodes()
	for len(remainingNodes) > 0 {
		var newRemainingNodes []*node
		for _, n := range remainingNodes {
			if n.dependencies == 0 && !n.keep {
				isChanged := g.diffMap[n.name]
				isExists := false
				if _, ok := g.currentValue[n.name]; ok {
					isExists = ok
				}
				if isChanged || isExists {
					// remove the node from the graph, we don't need to consider it anymore
					delete(g.nodes, n.name)
					for _, child := range n.children {
						child.dependencies--
						child.keep = isChanged
					}
				}
			} else {
				newRemainingNodes = append(newRemainingNodes, n)
			}
		}
		if len(newRemainingNodes) == len(remainingNodes) {
			// we have exactly the same number of node than in the previous loop
			// It means we can't shake more this graph. So let's stop it
			return
		}
		remainingNodes = newRemainingNodes
	}
}

type node struct {
	name     string
	keep     bool
	children map[string]*node
	// dependencies is the number of node that the current node depends on. Saying differently it's the number of incoming edge to this node.
	// Once this number is dropping to 0, the variable holt by this node can be built.
	dependencies uint64
}

func (n *node) addChild(node *node) {
	n.children[node.name] = node
	node.dependencies++
}
