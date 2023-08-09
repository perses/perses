// Copyright 2023 The Perses Authors
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

package utils

import (
	"fmt"
	"github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
	"github.com/perses/perses/pkg/model/api/v1/variable"
	"golang.org/x/exp/slices"
	"reflect"
	"regexp"
)

// We want to keep only variables that are not only a number.
// A number that represents a variable is not meaningful, and so we don't want to consider it.
// It's also a way to avoid a collision in terms of variable template syntax.
// For example in PromQL, in the function `label_replace`, it used the syntax $1, $2, for the placeholder.
var variableTemplateSyntaxRegexp = regexp.MustCompile(`\$(\w*?[^0-9]\w*)`)

// BuiltinVariablePrefixRegexp is the regex for detecting builtin variables (i.e.: $__dashboard, $__from, $__to, ...)
var BuiltinVariablePrefixRegexp = regexp.MustCompile(`^__`)

type VariableGroup struct {
	Variables []string
}

// BuildVariableOrder determinate which variable we have to build first (aka to perform the query).
// Here is the description of the algorithm followed:
//
// 1. First calculate which variable depend on others
// 2. Then, thanks to the dependencies, we can create a dependency graph.
// 3. Then we have to determinate the build order.
func BuildVariableOrder(variables []dashboard.Variable, projectVariables []*v1.Variable, globalVariables []*v1.GlobalVariable) ([]VariableGroup, error) {
	g, err := buildGraph(variables, projectVariables, globalVariables)
	if err != nil {
		return nil, err
	}
	return g.buildOrder()
}

func buildGraph(variables []dashboard.Variable, projectVariables []*v1.Variable, globalVariables []*v1.GlobalVariable) (*graph, error) {
	deps, err := buildVariableDependencies(variables, projectVariables, globalVariables)
	if err != nil {
		return nil, err
	}
	var variableNameList []string
	for _, v := range variables {
		variableNameList = append(variableNameList, v.Spec.GetName())
	}
	for _, v := range projectVariables {
		name := v.GetMetadata().GetName()
		if !slices.Contains(variableNameList, name) {
			variableNameList = append(variableNameList, name)
		}
	}
	for _, v := range globalVariables {
		name := v.GetMetadata().GetName()
		if !slices.Contains(variableNameList, name) {
			variableNameList = append(variableNameList, name)
		}
	}
	return newGraph(variableNameList, deps), nil
}

func buildVariableDependencies(variables []dashboard.Variable, projectVariables []*v1.Variable, globalVariables []*v1.GlobalVariable) (map[string][]string, error) {
	variableNames := make(map[string]bool, len(variables))
	// First build a list of the available variable name. That will be useful when creating the definedDeps
	// per variable to know if the definedDeps are defined.
	// We search also in the global and project variables.
	// NB: Considering the low amount of variables expected, this is not an issue for now to collect all vars at
	// project and global level before executing it. If it changes in the future, we might need to make one DB get by var.
	for _, v := range globalVariables {
		variableNames[v.GetMetadata().GetName()] = true
	}
	for _, v := range projectVariables {
		variableNames[v.GetMetadata().GetName()] = true
	}
	for _, v := range variables {
		variableNames[v.Spec.GetName()] = true
	}

	// Declare some map to store defined/undefined dependencies by variable.
	undefinedDeps := make(map[string][]string)
	definedDeps := make(map[string][]string)

	// Closure to be used for each variable of each variable list.
	// It checks the variables referenced in each variable and append them the dependency dictionary.
	// If it finds a reference to an undefined variable, it's appended to a separate dictionary.
	// /!\ Take care to follow the right priority order, calling the most prioritized at last.
	var loadVar = func(name string, matches [][]string) {
		// Each load of same name will reinitialize the previous one.
		delete(undefinedDeps, name)
		delete(definedDeps, name)

		var tmpDefinedDeps []string
		var tmpUndefinedDeps []string
		for _, match := range matches {
			// match[0] is the string that is matching the regexp (including the $)
			// match[1] is the string that is matching the group defined by the regexp. (the string without the $)
			usedVarName := match[1]
			if _, ok := variableNames[usedVarName]; !ok {
				if !slices.Contains(tmpUndefinedDeps, usedVarName) {
					tmpUndefinedDeps = append(tmpUndefinedDeps, usedVarName)
				}
			} else {
				if !slices.Contains(tmpDefinedDeps, usedVarName) {
					tmpDefinedDeps = append(tmpDefinedDeps, usedVarName)
				}
			}
		}
		if len(tmpDefinedDeps) > 0 {
			definedDeps[name] = tmpDefinedDeps
		}
		if len(tmpUndefinedDeps) > 0 {
			undefinedDeps[name] = tmpUndefinedDeps
		}
	}

	// Loop on the global variables
	for _, v := range globalVariables {
		name := v.GetMetadata().GetName()
		var matches [][]string
		switch spec := v.Spec.Spec.(type) {
		case *variable.TextSpec:
			matches = parseVariableUsed(spec.Value)
		case *variable.ListSpec:
			matches = findAllVariableUsedInPlugin(spec.Plugin)
		}
		loadVar(name, matches)
	}

	// Loop on the project variables
	for _, v := range projectVariables {
		name := v.GetMetadata().GetName()
		var matches [][]string
		switch spec := v.Spec.Spec.(type) {
		case *variable.TextSpec:
			matches = parseVariableUsed(spec.Value)
		case *variable.ListSpec:
			matches = findAllVariableUsedInPlugin(spec.Plugin)
		}
		loadVar(name, matches)
	}

	// Loop on the dashboard variables
	for _, v := range variables {
		name := v.Spec.GetName()
		var matches [][]string
		switch spec := v.Spec.(type) {
		case *dashboard.TextVariableSpec:
			matches = parseVariableUsed(spec.Value)
		case *dashboard.ListVariableSpec:
			matches = findAllVariableUsedInPlugin(spec.Plugin)
		}
		loadVar(name, matches)
	}

	// At the end, if the undefined dependency is not empty, then we send an error for the first one.
	for byVar, usedVars := range undefinedDeps {
		for _, usedVar := range usedVars {
			// Checking if the variable is not a builting variable
			isBuiltinVar := BuiltinVariablePrefixRegexp.MatchString(usedVar)
			if !isBuiltinVar {
				return nil, fmt.Errorf("variable %q is used in the variable %q but not defined", usedVar, byVar)
			}
		}
	}

	return definedDeps, nil
}

func findAllVariableUsedInPlugin(plugin common.Plugin) [][]string {
	var matches [][]string
	findAllVariableUsed(reflect.ValueOf(plugin.Spec), &matches)
	return matches
}

func findAllVariableUsed(v reflect.Value, matches *[][]string) {
	if len(v.Type().PkgPath()) > 0 {
		// the field is not exported, so no need to look at it as we won't be able to set it in a later stage
		return
	}
	v = common.GetReflectNextElem(v)

	switch v.Kind() {
	case reflect.Map:
		findVariableInMap(v, matches)
	case reflect.Slice:
		findVariableInSlice(v, matches)
	case reflect.Struct:
		findVariableInStruct(v, matches)
	}
}

func findVariableInMap(v reflect.Value, matches *[][]string) {
	// It's not possible that a variable is used a key in a map.
	// Simply because the key is supposed to be the name of a field in a proper struct.
	// Map here is the generic struct that represents the JSON / Yaml file
	for _, key := range v.MapKeys() {
		extractVariableInStringOrInSomethingElse(v.MapIndex(key), matches)
	}
}

func findVariableInSlice(v reflect.Value, matches *[][]string) {
	for i := 0; i < v.Len(); i++ {
		extractVariableInStringOrInSomethingElse(v.Index(i), matches)
	}
}

func findVariableInStruct(v reflect.Value, matches *[][]string) {
	// Same logic than for the map, we are only looking for the value and not the field itself.
	for i := 0; i < v.NumField(); i++ {
		extractVariableInStringOrInSomethingElse(v.Field(i), matches)
	}
}

func extractVariableInStringOrInSomethingElse(v reflect.Value, matches *[][]string) {
	// It's highly possible, the value is a pointer or an interface.
	// As we are not interested in these two type, we want to move forward and see what is behind the pointer / interface.
	v = common.GetReflectNextElem(v)
	if v.Kind() == reflect.String {
		*matches = append(*matches, parseVariableUsed(v.String())...)
	}
	findAllVariableUsed(v, matches)
}

func parseVariableUsed(str string) [][]string {
	return variableTemplateSyntaxRegexp.FindAllStringSubmatch(str, -1)
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

type graph struct {
	nodes map[string]*node
}

// newGraph creates a graph based on the variableListName available and the list of dependencies per variableName.
// dependencies key is the name of variable, the value is the list of variable on which the current variable depends on.
func newGraph(variableNameList []string, dependencies map[string][]string) *graph {
	g := &graph{
		nodes: make(map[string]*node),
	}
	for _, variableName := range variableNameList {
		g.nodes[variableName] = &node{
			name:     variableName,
			children: make(map[string]*node),
		}
	}
	for variableName, deps := range dependencies {
		for _, dep := range deps {
			// here we add to the node representing the dep, a child which is the variable that depend on the dep.
			// Like that once, we can build the dep, then we can loop others all variable that depend on the dep to reduce by the dependencies number.
			g.addEdge(dep, variableName)
		}
	}
	return g
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
func (g *graph) buildOrder() ([]VariableGroup, error) {
	remainingNodes := g.buildInitialRemainingNodes()
	var groups []VariableGroup
	for len(remainingNodes) > 0 {
		group := VariableGroup{}
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
