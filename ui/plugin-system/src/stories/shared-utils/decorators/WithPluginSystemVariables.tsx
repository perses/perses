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

import { StoryFn, StoryContext } from '@storybook/react';
import { ReactElement } from 'react';
import { VariableContext, VariableSrv } from '../../../runtime';

declare module '@storybook/react' {
  interface Parameters {
    withPluginSystemVariables?: WithPluginSystemVariableParameter;
  }
}

export type WithPluginSystemVariableParameter = {
  props: VariableSrv;
};

// Type guard because storybook types parameters as `any`
function isWithVariableParameter(
  parameter: unknown | WithPluginSystemVariableParameter
): parameter is WithPluginSystemVariableParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

// This decorator is used for non-dashboards package variable needs.
// Use the more specific decorator in the dashboards package when working with
// dashboards.
// This decorator includes "PluginSystem" in the name to differentiate it from
// the datasource store decorator in the `dashboards` package.
export const WithPluginSystemVariables = (Story: StoryFn, context: StoryContext<unknown>): ReactElement => {
  const initParameter = context.parameters.withPluginSystemVariables;
  const defaultValue: VariableSrv = {
    state: {},
  };
  const parameter = isWithVariableParameter(initParameter) ? initParameter : { props: defaultValue };

  const props = parameter?.props;

  return (
    <VariableContext.Provider value={props}>
      <Story />
    </VariableContext.Provider>
  );
};
