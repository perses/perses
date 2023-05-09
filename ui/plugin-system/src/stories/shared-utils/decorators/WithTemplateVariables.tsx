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

// This decorator is used for non-dashboards package template variable needs.
// Use the more specific decorator in the dashboards package when working with
// dashboards.

import { StoryFn, StoryContext } from '@storybook/react';
import { TemplateVariableContext, TemplateVariableSrv } from '../../../runtime';

export type WithTemplateVariableParameter = {
  props: TemplateVariableSrv;
};

// Type guard because storybook types parameters as `any`
function isWithTemplateVariableParameter(
  parameter: unknown | WithTemplateVariableParameter
): parameter is WithTemplateVariableParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

export const WithTemplateVariables = (Story: StoryFn, context: StoryContext<unknown>) => {
  const initParameter = context.parameters.withTemplateVariables;
  const defaultValue: TemplateVariableSrv = {
    state: {},
  };
  const parameter = isWithTemplateVariableParameter(initParameter) ? initParameter : { props: defaultValue };

  const props = parameter?.props;

  return (
    <TemplateVariableContext.Provider value={props}>
      <Story />
    </TemplateVariableContext.Provider>
  );
};
