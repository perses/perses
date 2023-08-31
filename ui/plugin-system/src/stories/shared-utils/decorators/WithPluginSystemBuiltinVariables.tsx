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

import { StoryFn, StoryContext } from '@storybook/react';
import { BuiltinVariableContext, BuiltinVariableSrv } from '../../../runtime';

declare module '@storybook/react' {
  interface Parameters {
    withPluginSystemBuiltinVariables?: WithPluginSystemBuiltinVariableParameter;
  }
}

export type WithPluginSystemBuiltinVariableParameter = {
  props: BuiltinVariableSrv;
};

// Type guard because storybook types parameters as `any`
function isWithBuiltinVariableParameter(
  parameter: unknown | WithPluginSystemBuiltinVariableParameter
): parameter is WithPluginSystemBuiltinVariableParameter {
  return !!parameter && Array.isArray(parameter);
}

// This decorator is used for non-dashboards package Builtin variable needs.
// Use the more specific decorator in the dashboards package when working with
// dashboards.
// This decorator includes "PluginSystem" in the name to differentiate it from
// the datasource store decorator in the `dashboards` package.
export const WithPluginSystemBuiltinVariables = (Story: StoryFn, context: StoryContext<unknown>) => {
  const initParameter = context.parameters.withPluginSystemBuiltinVariables;
  const defaultValue: BuiltinVariableSrv = {
    variables: [],
  };
  const parameter = isWithBuiltinVariableParameter(initParameter) ? initParameter : { props: defaultValue };

  const props = parameter?.props;

  return (
    <BuiltinVariableContext.Provider value={props}>
      <Story />
    </BuiltinVariableContext.Provider>
  );
};
