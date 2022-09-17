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

	"github.com/perses/perses/pkg/model/api/v1/dashboard"
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
func BuildOrder(variables map[string]*dashboard.Variable) ([]Group, error) {
	g, err := buildGraph(variables)
	if err != nil {
		return nil, err
	}
	return g.buildOrder()
}

func buildGraph(variables map[string]*dashboard.Variable) (*graph, error) {
	deps, err := buildVariableDependencies(variables)
	if err != nil {
		return nil, err
	}
	vars := make([]string, 0, len(variables))
	for v := range variables {
		vars = append(vars, v)
	}
	return newGraph(vars, deps), nil
}

func buildVariableDependencies(variables map[string]*dashboard.Variable) (map[string][]string, error) {
	result := make(map[string][]string)
	for name, variable := range variables {
		if !variableRegexp.MatchString(name) {
			return nil, fmt.Errorf("%q is not a correct variable name. It should match the regexp: %s", name, variableRegexp.String())
		}
		var matches [][]string
		switch param := variable.Parameter.(type) {
		case *dashboard.PromQLQueryVariableParameter:
			matches = findAllVariableUsed(param.Expr)
		case *dashboard.LabelNamesQueryVariableParameter:
			for _, matcher := range param.Matchers {
				matches = append(matches, findAllVariableUsed(matcher)...)
			}
		case *dashboard.LabelValuesQueryVariableParameter:
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
				return nil, fmt.Errorf("variable %q is used in the variable %q but not defined", match[1], name)
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

func newGraph(variables []string, dependencies map[string][]string) *graph {
	g := &graph{
		nodes: make(map[string]*node),
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
	nodes map[string]*node
}

// buildOrder determinate the build order of the variables
// For example we could have:
//
//	   (f)         (d)
//	  / | \         |
//	(c) |  (b)     (g)
//	 \  |  /|
//	   (a)  /
//	    |  /
//	    | /
//	    (e)
//
// In this example, we should build first (f) and (d), because there is no incoming edge to these nodes.
// Once it is done, it is irrelevant that some nodes are dependent on (f) and (d) since they have already been built.
// So we can remove the d and f's outgoing edges.
//
//	build order, (f), (d)
//	    (f)         (d)
//
//	 (c)    (b)     (g)
//	  \     /|
//	    (a)  /
//	     |  /
//	     | /
//	     (e)
//
// Also we can notice (f) and (d) can be built in parallel.
// So instead of having an ordered list of the different variable/node to build, we could have instead a list of ordered variable's group.
// Where every variable contained in the group can be built in parallel.
// Like that we have now the following build order:
//
//	build order: group0
//	group0: (f), (d)
//
// Next we can build (c), (b) and (g) (also in parallel applying the same logic as above) And then we can remove their outgoing edges
//
//	build order: group0, group1
//	group0: (f), (d)
//	group1: (c), (b), (g)
//	    (f)         (d)
//
//	 (c)    (b)     (g)
//
//	    (a)
//	     |
//	     |
//	    (e)
//
// Then variable (a) can be built which is removing the outgoing edge to (e). This leaves just (e) to be built and we have the final build order:
//
//	build order: group0, group1, group2, group3
//	group0: (f), (d)
//	group1: (c), (b), (g)
//	group2: (a)
//	group3: (e)
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

type node struct {
	name     string
	children map[string]*node
	// dependencies is the number of node that the current node depends on. Saying differently it's the number of incoming edge to this node.
	// Once this number is dropping to 0, the variable holt by this node can be built.
	dependencies uint64
}

func (n *node) addChild(node *node) {
	n.children[node.name] = node
	node.dependencies++
}
