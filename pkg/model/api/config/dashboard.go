// Copyright 2025 The Perses Authors
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

package config

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/PaesslerAG/gval"
	"github.com/PaesslerAG/jsonpath"
	"github.com/google/cel-go/cel"
)

type CustomLintRule struct {
	// Name of the rule
	Name string `json:"name" yaml:"name"`
	// Target is a JSONPath expression to extract the relevant portion of the dashboard data.
	// Refer to https://goessner.net/articles/JsonPath/ for the syntax.
	Target   string `json:"target" yaml:"target"`
	jsonEval gval.Evaluable
	// Assertion is a CEL expression that validates the extracted value.
	// Refer to https://github.com/google/cel-spec/blob/master/doc/langdef.md for the syntax.
	Assertion  string `json:"assertion" yaml:"assertion"`
	celProgram cel.Program
	// Message is displayed if the assertion fails.
	Message string `json:"message" yaml:"message"`
	// Disable is a flag to disable the rule.
	Disable bool `json:"disable" yaml:"disable"`
}

func (c *CustomLintRule) Verify() error {
	if len(c.Name) == 0 {
		return errors.New("name is required")
	}
	if len(c.Target) == 0 {
		return fmt.Errorf("target is required for the rule %q", c.Name)
	}
	if len(c.Assertion) == 0 {
		return fmt.Errorf("assertion is required for the rule %q", c.Name)
	}
	if len(c.Message) == 0 {
		return fmt.Errorf("message is required for the rule %q", c.Name)
	}
	return nil
}

func (c *CustomLintRule) Evaluate(data map[string]any) error {
	if c.jsonEval == nil {
		if err := c.evaluateAndLoadJSONExpression(); err != nil {
			return err
		}
	}
	if c.celProgram == nil {
		if err := c.evaluateAndLoadCELExpression(); err != nil {
			return err
		}
	}
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Second*10))
	defer cancel()
	value, err := c.jsonEval(ctx, data)
	if err != nil {
		return fmt.Errorf("error while evaluating the jsonpath expression for the rule %q: %w", c.Name, err)
	}
	out, _, err := c.celProgram.Eval(map[string]any{"value": value})
	if err != nil {
		return fmt.Errorf("error while evaluating the CEL program for the rule %q: %w", c.Name, err)
	}
	if out.Type() == cel.BoolType {
		if out.Value().(bool) {
			return nil
		}
		return errors.New(c.Message)
	}
	return fmt.Errorf("the returned type of the CEL program for the rule %q is not a boolean", c.Name)
}

func (c *CustomLintRule) evaluateAndLoadJSONExpression() error {
	builder := gval.Full(jsonpath.PlaceholderExtension())
	jsonEval, jsonBuilderErr := builder.NewEvaluable(c.Target)
	if jsonBuilderErr != nil {
		return fmt.Errorf("error while building the jsonpath expression for the rule %q: %w", c.Name, jsonBuilderErr)
	}
	c.jsonEval = jsonEval
	return nil
}

func (c *CustomLintRule) evaluateAndLoadCELExpression() error {
	celEnv, err := cel.NewEnv(cel.Variable("value", cel.AnyType))
	if err != nil {
		return fmt.Errorf("error while creating the CEL environment: %w", err)
	}
	ast, issues := celEnv.Compile(c.Assertion)
	if issues != nil {
		return fmt.Errorf("error while compiling the CEL assertion for the rule %q: %w", c.Name, issues.Err())
	}
	prg, err := celEnv.Program(ast)
	if err != nil {
		return fmt.Errorf("error while creating the CEL program for the rule %q: %w", c.Name, err)
	}
	c.celProgram = prg
	return nil
}

type DashboardConfig struct {
	CustomLintRules []*CustomLintRule `json:"custom_lint_rules,omitempty" yaml:"custom_lint_rules,omitempty"`
}

func (c *DashboardConfig) Verify() error {
	ruleName := make(map[string]struct{})
	for _, rule := range c.CustomLintRules {
		if _, ok := ruleName[rule.Name]; ok {
			return fmt.Errorf("duplicate rule name %q", rule.Name)
		}
		ruleName[rule.Name] = struct{}{}
		if err := rule.evaluateAndLoadCELExpression(); err != nil {
			return err
		}
		if err := rule.evaluateAndLoadJSONExpression(); err != nil {
			return err
		}
	}
	return nil
}
