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

import { Definition, UnknownSpec } from '@perses-dev/core';
import { DataQueriesProvider, DataQueriesProviderProps } from '@perses-dev/plugin-system';
import { StoryFn, StoryContext } from '@storybook/react';

export type WithDataQueriesProvideParameter = {
  props: DataQueriesProviderProps;
};

// Type guard because storybook types parameters as `any`
function isWithDataQueriesParameter(
  parameter: unknown | WithDataQueriesProvideParameter
): parameter is WithDataQueriesProvideParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

export const WithDataQueries = (Story: StoryFn, context: StoryContext<unknown>) => {
  const initParameter = context.parameters.WithDataQueries;
  const parameter = isWithDataQueriesParameter(initParameter)
    ? initParameter
    : { props: { definitions: [] as Array<Definition<UnknownSpec>> } };
  const props = parameter?.props;

  return (
    <DataQueriesProvider {...props}>
      <Story />
    </DataQueriesProvider>
  );
};
