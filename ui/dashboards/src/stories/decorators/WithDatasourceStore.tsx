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
import { DatasourceStoreProvider, DatasourceStoreProviderProps } from '@perses-dev/dashboards';
import { defaultDatasourceProps } from '../../test';

declare module '@storybook/react' {
  interface Parameters {
    withDatasourceStore?: WithDatasourceStoreParameter;
  }
}

export type WithDatasourceStoreParameter = {
  props: Partial<DatasourceStoreProviderProps>;
};

// Type guard because storybook types parameters as `any`
function isWithDatasourceStoreParameter(
  parameter: unknown | WithDatasourceStoreParameter
): parameter is WithDatasourceStoreParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

export const WithDatasourceStore = (Story: StoryFn, context: StoryContext<unknown>) => {
  const initParameter = context.parameters.withDatasourceStore;
  const parameter = isWithDatasourceStoreParameter(initParameter) ? initParameter : undefined;
  const props = parameter?.props;

  return (
    <DatasourceStoreProvider {...defaultDatasourceProps} {...props}>
      <Story />
    </DatasourceStoreProvider>
  );
};
